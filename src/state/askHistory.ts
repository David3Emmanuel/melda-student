// On-device transcript for "Study with MELDA". Each lesson keeps its own short
// Q&A history so a student can scroll back over what they asked - but only on
// this device: the server answers statelessly and never stores the transcript.
//
// AsyncStorage is the same persistence the session store already uses (no new
// dependency). The pure appendTurn is the piece worth testing; the load/save
// wrappers are thin JSON-over-AsyncStorage and degrade to an empty history on
// any read error rather than lose the reader to a corrupt value.

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AskTurn {
  question: string;
  answer: string;
}

// Keep the last N turns per lesson. Enough to scroll back a whole study session,
// bounded so a chatty student can't grow one device key without limit.
export const HISTORY_CAP = 20;

// Bump the suffix on any stored-shape change: an old value is then ignored and
// the lesson starts with an empty transcript (acceptable - history is on-device
// convenience, not data of record).
const keyFor = (lessonId: string) => `melda-ask-v1:${lessonId}`;

/** Append a turn and keep only the last `cap` - pure, so it's the tested core. */
export function appendTurn(
  history: AskTurn[],
  turn: AskTurn,
  cap: number = HISTORY_CAP,
): AskTurn[] {
  return [...history, turn].slice(-cap);
}

/** This lesson's saved transcript, or [] when absent or corrupt. */
export async function loadHistory(lessonId: string): Promise<AskTurn[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(lessonId));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? (parsed as AskTurn[]) : [];
  } catch {
    return [];
  }
}

/** Persist this lesson's transcript. Fire-and-forget from the reader. */
export async function saveHistory(lessonId: string, history: AskTurn[]): Promise<void> {
  await AsyncStorage.setItem(keyFor(lessonId), JSON.stringify(history));
}
