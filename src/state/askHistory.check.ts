// Runnable check for the pure history core: appendTurn grows the transcript,
// preserves chronological order, caps to the last N, and never mutates its input.
// No AsyncStorage, no React. `pnpm check:history` (tsx).

import { appendTurn, type AskTurn } from './askHistory';

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

const turn = (n: number): AskTurn => ({ question: `q${n}`, answer: `a${n}` });

console.log('ask history');

// 1. appends to the end, in order
const one = appendTurn([], turn(1));
eq(one.length, 1, 'appending to an empty history yields one turn');
const two = appendTurn(one, turn(2));
eq(two.length, 2, 'a second turn grows the history');
eq(two[1].question, 'q2', 'the newest turn is last');
eq(two[0].question, 'q1', 'the older turn stays first');

// 2. caps to the last `cap`, dropping the oldest
const capped = appendTurn(two, turn(3), 2);
eq(capped.length, 2, 'the history is capped to `cap`');
eq(capped[0].question, 'q2', 'the oldest turn is dropped when over cap');
eq(capped[1].question, 'q3', 'the newest turn is kept');

// 3. the input is never mutated (a new array is returned)
const base: AskTurn[] = [turn(1)];
const after = appendTurn(base, turn(2), 5);
eq(base.length, 1, 'appendTurn does not mutate its input');
ok(after !== base, 'appendTurn returns a new array');

console.log(`\nAll ${passed} assertions passed.`);
