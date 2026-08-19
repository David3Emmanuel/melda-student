// The student's quiz. The paper arrives with the answer key stripped
// (redactAssignment on the server), so grading happens server-side: the student
// picks answers, submits, and the backend returns their score. A submitted review
// opens straight to that score with the option to try again.
//
// Deliberate simplification: the result shows the overall score only, not a
// per-question right/wrong breakdown. The answer key never leaves the server, so
// the client has nothing to mark against. Ceiling: no per-question feedback for
// the student; upgrade path is a graded-review endpoint that returns each answer's
// correctness (still without leaking the key for un-submitted papers).

import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { Question, Selections } from 'melda-shared';
import { api, ApiError } from '../../../src/api/client';
import { useApi } from '../../../src/api/useApi';
import {
  Button,
  Card,
  EmptyState,
  Loading,
  Screen,
  StatTile,
  Txt,
} from '../../../src/ui/components';
import { color, masteryTone, radius, sp, weight } from '../../../src/ui/tokens';

export default function Quiz() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const router = useRouter();
  const { data, loading, error } = useApi(() => api.assignment(assignmentId));

  const [selections, setSelections] = useState<Selections>({});
  const [localScore, setLocalScore] = useState<number | null>(null);
  const [retaking, setRetaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

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
        <EmptyState title="Could not load this review" body={error ?? undefined} icon="🔍" />
      </Screen>
    );
  }

  const { assignment } = data;
  // The score to display: the one just earned, or the stored one for an
  // already-submitted paper (unless the student chose to retake).
  const shownScore = localScore ?? (data.submitted && !retaking ? data.scorePct : null);

  const submit = async () => {
    setBusy(true);
    setFailed(null);
    try {
      const res = await api.submitAssignment(assignmentId, selections);
      setLocalScore(res.scorePct);
      setRetaking(false);
    } catch (e) {
      setFailed(e instanceof ApiError ? e.message : 'Could not submit. Is the backend running?');
    } finally {
      setBusy(false);
    }
  };

  const retake = () => {
    setSelections({});
    setLocalScore(null);
    setRetaking(true);
  };

  if (shownScore !== null) {
    const mastery = masteryTone(shownScore);
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
        <Txt variant="tiny" c={color.inkMuted}>
          MELDA shares how the whole class did with your teacher.
        </Txt>
        <Button title="Try again" icon="↻" variant="secondary" onPress={retake} />
        <Button
          title="Back to my work"
          variant="ghost"
          onPress={() => router.replace('/(student)')}
        />
      </Screen>
    );
  }

  const answerable = assignment.questions.filter((q) => q.choices?.length);
  const allAnswered = answerable.every((q) => selections[q.id] !== undefined);

  return (
    <Screen>
      <Stack.Screen options={{ title: assignment.title }} />
      <Txt variant="body" c={color.inkSecondary}>
        {assignment.questions.length} question{assignment.questions.length === 1 ? '' : 's'} · pick
        the best answer.
      </Txt>

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
        icon="✓"
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
      <Txt variant="h3" style={{ marginTop: sp.xs }}>
        {q.prompt}
      </Txt>
      {q.choices?.length ? (
        <View style={{ gap: sp.sm, marginTop: sp.md }}>
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
