// Runnable check for the student API client with global fetch stubbed: it targets
// the right method+path, attaches the bearer token and a JSON body, parses success,
// maps a non-2xx {error} into a thrown ApiError, and fires the unauthorized handler
// on a 401. No network, no server. `pnpm check:client` (tsx).

import { api, ApiError, setAuthToken, setUnauthorizedHandler } from './client';

let passed = 0;
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error('FAIL: ' + msg);
  passed++;
  console.log('  ok -', msg);
}
function eq<T>(actual: T, expected: T, msg: string) {
  ok(
    actual === expected,
    `${msg} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`,
  );
}

interface Captured {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
}
let last: Captured | null = null;

function stubFetch(status: number, payload: unknown) {
  globalThis.fetch = (async (
    url: string,
    init: { method?: string; headers?: Record<string, string>; body?: string } = {},
  ) => {
    last = {
      url: String(url),
      method: init.method ?? 'GET',
      headers: init.headers ?? {},
      body: init.body,
    };
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => (payload === undefined ? '' : JSON.stringify(payload)),
    };
  }) as unknown as typeof fetch;
}

async function main() {
  console.log('student api client');

  // 1. login: POST /auth/login as a student, with a JSON body, no token attached yet
  setAuthToken(null);
  stubFetch(200, {
    token: 'jwt-abc',
    user: { id: 's1', role: 'student', name: 'A', email: 'a@b.c' },
  });
  const auth = await api.login({ email: 'a@b.c', password: 'pw', role: 'student' });
  eq(last!.method, 'POST', 'login uses POST');
  ok(last!.url.endsWith('/auth/login'), 'login hits /auth/login');
  eq(last!.headers['content-type'], 'application/json', 'a body sets content-type');
  eq(JSON.parse(last!.body!).role, 'student', 'login body carries the student role');
  ok(last!.headers.authorization === undefined, 'no auth header before a token is set');
  eq(auth.token, 'jwt-abc', 'login parses the token from the response');

  // 2. once a token is set, reads attach it as a bearer and send no body
  setAuthToken('jwt-abc');
  stubFetch(200, []);
  await api.myClasses();
  eq(last!.method, 'GET', 'myClasses uses GET');
  ok(last!.url.endsWith('/me/classes'), 'myClasses hits /me/classes');
  eq(last!.headers.authorization, 'Bearer jwt-abc', 'the token rides as a bearer header');
  ok(last!.body === undefined, 'a GET sends no body');

  // 3. the student lists only their own papers for a class
  stubFetch(200, []);
  await api.assignments('class-1');
  ok(last!.url.endsWith('/classes/class-1/assignments'), 'assignments builds the class path');

  // 4. submitting posts the selections under the assignment
  stubFetch(201, { submitted: true, scorePct: 80 });
  const result = await api.submitAssignment('a-1', { q1: 0, q2: 2 });
  eq(last!.method, 'POST', 'submit uses POST');
  ok(last!.url.endsWith('/assignments/a-1/submissions'), 'submit hits the submissions path');
  eq(JSON.parse(last!.body!).selections.q2, 2, 'submit body wraps the selections');
  eq(result.scorePct, 80, 'submit parses the server-graded score');

  // 5. a help request posts a learning signal
  stubFetch(201, { id: 'sig-1' });
  await api.recordSignal({ type: 'REQUEST_SIMPLER', sectionId: 'sec-1' });
  ok(last!.url.endsWith('/signals'), 'recordSignal hits /signals');
  eq(JSON.parse(last!.body!).type, 'REQUEST_SIMPLER', 'the signal type rides in the body');

  // 5b. study with MELDA: the ask posts the lesson-grounded question
  stubFetch(200, { answer: 'Here is a simpler take.' });
  const asked = await api.askMelda({ lessonId: 'l-1', sectionId: 'sec-1', question: 'why?' });
  eq(last!.method, 'POST', 'askMelda uses POST');
  ok(last!.url.endsWith('/ai/ask'), 'askMelda hits /ai/ask');
  eq(JSON.parse(last!.body!).lessonId, 'l-1', 'ask body carries the lessonId');
  eq(JSON.parse(last!.body!).question, 'why?', 'ask body carries the question');
  eq(asked.answer, 'Here is a simpler take.', 'askMelda parses the answer');

  // 5c. save materials: save/unsave a lesson and list the saved ones
  stubFetch(201, { ok: true });
  await api.saveLesson('l-1');
  eq(last!.method, 'POST', 'saveLesson uses POST');
  ok(last!.url.endsWith('/lessons/l-1/save'), 'saveLesson hits the lesson save path');
  ok(last!.body === undefined, 'saveLesson sends no body');

  stubFetch(200, { ok: true });
  await api.unsaveLesson('l-1');
  eq(last!.method, 'DELETE', 'unsaveLesson uses DELETE');
  ok(last!.url.endsWith('/lessons/l-1/save'), 'unsaveLesson hits the lesson save path');

  stubFetch(200, [{ id: 'l-1' }]);
  const saved = await api.savedLessons();
  eq(last!.method, 'GET', 'savedLessons uses GET');
  ok(last!.url.endsWith('/me/saved'), 'savedLessons hits /me/saved');
  eq(saved.length, 1, 'savedLessons parses the returned lessons');

  // 6. a non-2xx maps the server {error} into a thrown ApiError
  stubFetch(404, { error: 'assignment not found' });
  let thrown: unknown;
  try {
    await api.assignment('a-x');
  } catch (e) {
    thrown = e;
  }
  ok(thrown instanceof ApiError, 'a non-2xx throws ApiError');
  eq((thrown as ApiError).status, 404, 'the ApiError carries the status');
  eq(
    (thrown as ApiError).message,
    'assignment not found',
    'the ApiError carries the server message',
  );

  // 7. a 401 fires the unauthorized handler (so an expired session logs out)
  let unauthorized = 0;
  setUnauthorizedHandler(() => {
    unauthorized++;
  });
  stubFetch(401, { error: 'invalid or expired token' });
  try {
    await api.myClasses();
  } catch {
    /* expected */
  }
  eq(unauthorized, 1, 'a 401 triggers the unauthorized handler');
  setUnauthorizedHandler(null);

  console.log(`\nAll ${passed} assertions passed.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
