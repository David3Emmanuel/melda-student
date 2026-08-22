// The student's quiz. The paper arrives with the answer key stripped
// (redactAssignment on the server), so grading happens server-side: the student
// picks answers, submits, and the backend returns their score plus the concepts
// to re-study ("topics to review" - names only, the key never leaves the
// server). A submitted review opens straight to that score with the option to
// try again, and an in-progress paper is guarded against a fat-fingered back.
//
// Deliberate simplification: still no per-question right/wrong breakdown. The
// client never sees the key, so it has nothing to mark against; the topics hint
// is the answer-independent view of what went wrong.

import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { Question, Selections } from 'melda-shared';
import { api, ApiError } from '../../../src/api/client';
import { useApi } from '../../../src/api/useApi';
import { useUnsavedGuard } from '../../../src/hooks/useUnsavedGuard';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Loading,
  Row,
  Screen,
  StatTile,
  Txt,
} from 'melda-shared/ui/components';
import { color, masteryTone, radius, sp, weight } from 'melda-shared/ui/tokens';

export default function Quiz() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const router = useRouter();
  const { data, loading, error, reload } = useApi(() => api.assignment(assignmentId));

  const [selections, setSelections] = useState<Selections>({});
  const [localScore, setLocalScore] = useState<number | null>(null);
  const [localTopics, setLocalTopics] = useState<string[] | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [retaking, setRetaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  // The score to display: the one just earned, or the stored one for an
  // already-submitted paper (unless the student chose to retake).
  const shownScore = localScore ?? (data?.submitted && !retaking ? data.scorePct : null);

  // Unsaved-guard while the student has answered something they haven't
  // submitted (a fresh unanswered paper and the result view are free to leave).
  const answerable = data?.assignment.questions.filter((q) => q.choices?.length) ?? [];
  useUnsavedGuard(shownScore === null && answerable.some((q) => selections[q.id] !== undefined));

  if (loading && !data) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Review' }} />
        <Loading />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Review' }} />
        <ErrorState
          title="Could not load this review"
          message={error ?? undefined}
          onRetry={reload}
        />
      </Screen>
    );
  }

  const { assignment } = data;

  const submit = async () => {
    setBusy(true);
    setFailed(null);
    try {
      const res = await api.submitAssignment(assignmentId, selections);
      setLocalScore(res.scorePct);
      setLocalTopics(res.topicsToReview);
      setRetaking(false);
    } catch (e) {
      setFailed(
        e instanceof ApiError
          ? e.message
          : "Can't connect to MELDA right now. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const retake = () => {
    setLastScore(shownScore);
    setSelections({});
    setLocalScore(null);
    setLocalTopics(null);
    setRetaking(true);
  };

  if (shownScore !== null) {
    const mastery = masteryTone(shownScore);
    // Fresh submissions carry their topics in the response; a stored paper
    // carries them on the assignment read (server-computed, so re-opening a
    // result screen never leaks the key either).
    const topics = localTopics ?? (data.submitted && !retaking ? (data.topicsToReview ?? []) : []);
    return (
      <Screen>
        <Stack.Screen options={{ title: assignment.title }} />
        <StatTile
          label="Your score"
          value={`${shownScore}%`}
          tone={mastery.tone}
          caption={mastery.label}
        />
        <Txt variant="body" c={color.inkSecondary}>
          {shownScore >= 75
            ? 'Great work. You have this one down.'
            : shownScore >= 50
              ? 'Good start. Try it again to lock it in.'
              : "That's okay. Give it another go, and tell your teacher which parts are hard."}
        </Txt>
        {topics.length ? (
          <Card>
            <Txt variant="small" w={weight.semibold}>
              Topics to review
            </Txt>
            <Txt variant="small" c={color.inkMuted} style={{ marginTop: sp.xs }}>
              Your missed questions were about:
            </Txt>
            <Row wrap gap={sp.xs} style={{ marginTop: sp.sm }}>
              {topics.map((t) => (
                <Badge key={t} label={t} tone="warn" />
              ))}
            </Row>
          </Card>
        ) : null}
        <Txt variant="tiny" c={color.inkMuted}>
          MELDA shares how the whole class did with your teacher.
        </Txt>
        <Button title="Try again" icon="refresh" variant="secondary" onPress={retake} />
        <Button
          title="Back to my work"
          variant="ghost"
          onPress={() => router.replace('/(student)')}
        />
      </Screen>
    );
  }

  const allAnswered = answerable.every((q) => selections[q.id] !== undefined);

  return (
    <Screen>
      <Stack.Screen options={{ title: assignment.title }} />
      <Txt variant="body" c={color.inkSecondary}>
        {assignment.questions.length} question{assignment.questions.length === 1 ? '' : 's'} · pick
        the best answer.
      </Txt>
      {lastScore !== null ? (
        <Txt variant="small" c={color.inkMuted}>
          Your last score was {lastScore}%.
        </Txt>
      ) : null}

      {assignment.questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          q={q}
          index={i}
          selected={selections[q.id]}
          onSelect={(ci) => setSelections((prev) => ({ ...prev, [q.id]: ci }))}
        />
      ))}

      {failed ? (
        <Txt variant="small" c={color.struggle}>
          {failed}
        </Txt>
      ) : null}

      <Button
        title="Submit answers"
        icon="check"
        loading={busy}
        disabled={!allAnswered}
        onPress={submit}
      />
      {!allAnswered ? (
        <Txt variant="tiny" c={color.inkMuted} center>
          Answer every question to submit.
        </Txt>
      ) : null}
    </Screen>
  );
}

function QuestionCard(props: {
  q: Question;
  index: number;
  selected: number | undefined;
  onSelect: (choiceIndex: number) => void;
}) {
  const { q, index, selected, onSelect } = props;
  return (
    <Card>
      <Txt
        variant="tiny"
        c={color.inkMuted}
        w={weight.semibold}
        style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        Question {index + 1}
      </Txt>
      <Txt variant="h3" nativeID={`q-${q.id}-prompt`} style={{ marginTop: sp.xs }}>
        {q.prompt}
      </Txt>
      {q.choices?.length ? (
        // The choices of one question are a radiogroup named by its prompt, and
        // each choice carries aria-checked (react-native-web drops the legacy
        // accessibilityState mapping), so a screen reader can tell which answer
        // is picked.
        <View
          accessibilityRole="radiogroup"
          aria-labelledby={`q-${q.id}-prompt`}
          style={{ gap: sp.sm, marginTop: sp.md }}
        >
          {q.choices.map((choice, ci) => (
            <Choice
              key={ci}
              label={choice}
              selected={selected === ci}
              onPress={() => onSelect(ci)}
            />
          ))}
        </View>
      ) : (
        // Short-answer questions have no choices to grade, so there is nothing to
        // submit for them; the student talks these through in class.
        <Txt variant="small" c={color.inkMuted} style={{ marginTop: sp.sm }}>
          Talk this one through with your class.
        </Txt>
      )}
    </Card>
  );
}

function Choice(props: { label: string; selected: boolean; onPress: () => void }) {
  const { label, selected, onPress } = props;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      aria-checked={selected}
      accessibilityState={{ checked: selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: sp.md,
        borderWidth: 1,
        borderColor: selected ? color.accent : color.border,
        backgroundColor: selected ? color.accentSoft : color.card,
        borderRadius: radius.md,
        paddingVertical: sp.md,
        paddingHorizontal: sp.md,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: radius.pill,
          borderWidth: 2,
          borderColor: selected ? color.accent : color.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: radius.pill,
              backgroundColor: color.accent,
            }}
          />
        ) : null}
      </View>
      <Txt variant="body" c={selected ? color.accentInk : color.ink} style={{ flex: 1 }}>
        {label}
      </Txt>
    </Pressable>
  );
}
