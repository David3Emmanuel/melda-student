// The student app's single door to the backend. The student reads their own
// lessons and papers through `api.*` and submits through it; the server grades
// and owns every number, and the Anthropic key never leaves the backend.
//
// The JWT is not imported from the store here (that would be a cycle): the session
// store pushes it in via setAuthToken after login/hydrate and clears it on logout.
//
// This mirrors the teacher app's client deliberately - same request plumbing, a
// smaller surface. The student endpoints return only this student's own data
// (StudentAssignment, published lessons); classmates' data never reaches here.

import type {
  AuthResponse,
  ClassCard,
  Lesson,
  LoginRequest,
  RecordSignalRequest,
  Selections,
  StudentAssignment,
} from 'melda-shared';

// EXPO_PUBLIC_ is inlined into the bundle at build time. This is a URL, not a
// secret - the Anthropic key stays on the server. Defaults to the backend dev port.
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** The session store pushes the JWT here after login/hydrate, and clears it on logout. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Registered by the session store so an expired token logs the user out once, everywhere. */
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

/** A non-2xx response, carrying the HTTP status and the server's error message. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : null),
      ...(authToken ? { authorization: `Bearer ${authToken}` } : null),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.();
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return payload as T;
}

export const api = {
  login: (body: LoginRequest) => request<AuthResponse>('POST', '/auth/login', body),

  myClasses: () => request<ClassCard[]>('GET', '/me/classes'),

  // The backend returns only published lessons to a student.
  lessons: (classId: string) => request<Lesson[]>('GET', `/classes/${classId}/lessons`),
  lesson: (lessonId: string) => request<Lesson>('GET', `/lessons/${lessonId}`),

  // Each StudentAssignment carries the paper (answer key stripped) plus this
  // student's own status and score - never a classmate's.
  assignments: (classId: string) =>
    request<StudentAssignment[]>('GET', `/classes/${classId}/assignments`),
  assignment: (assignmentId: string) =>
    request<StudentAssignment>('GET', `/assignments/${assignmentId}`),

  // The server grades via buildSubmission and returns the score; the client never
  // sees the answer key, so it can't grade locally.
  submitAssignment: (assignmentId: string, selections: Selections) =>
    request<{ submitted: boolean; scorePct: number }>(
      'POST',
      `/assignments/${assignmentId}/submissions`,
      { selections },
    ),

  // A learning signal (e.g. REQUEST_SIMPLER when a student asks for help). The
  // server scopes it to the student's class; this is what the teacher sees live.
  recordSignal: (body: RecordSignalRequest) => request<{ id: string }>('POST', '/signals', body),

  // Study with MELDA: a question grounded in the lesson the student is reading.
  // The server answers statelessly (no transcript stored) - the app keeps its own
  // on-device history - and the Anthropic key never leaves the backend.
  askMelda: (body: { lessonId: string; sectionId?: string; question: string }) =>
    request<{ answer: string }>('POST', '/ai/ask', body),

  // Save materials: a lesson the student bookmarks to find again on the Saved tab.
  // The composite key on the server makes a repeat save idempotent.
  saveLesson: (lessonId: string) => request<{ ok: true }>('POST', `/lessons/${lessonId}/save`),
  unsaveLesson: (lessonId: string) => request<{ ok: true }>('DELETE', `/lessons/${lessonId}/save`),
  savedLessons: () => request<Lesson[]>('GET', '/me/saved'),
};
