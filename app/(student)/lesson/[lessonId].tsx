// The student's lesson reader. Each section shows any simpler explanations the
// teacher (with MELDA) has already saved for it. If a section still doesn't land,
// "I don't get this" fires a REQUEST_SIMPLER signal (POST /signals) - the exact
// record the teacher sees live on their dashboard - AND returns an instant
// section-grounded AI answer in the same tap, so a stuck student is never left
// with nothing while the teacher prepares a durable adaptation.
//
// Two more things live here: a Save toggle (bookmark the lesson to the Saved tab)
// and "Study with MELDA" at the bottom - an ask box grounded in this lesson. The
// ask is proxied through the backend (the Anthropic key never leaves the server)
// and answered statelessly; the Q&A transcript is kept only on this device.

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { Adaptation, LessonSection } from 'melda-shared';
import { api } from '../../../src/api/client';
import { useApi } from '../../../src/api/useApi';
import { appendTurn, loadHistory, saveHistory, type AskTurn } from '../../../src/state/askHistory';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Icon,
  Input,
  Loading,
  Row,
  Screen,
  Txt,
} from 'melda-shared/ui/components';
import { adaptationLabel, color, sp, weight } from 'melda-shared/ui/tokens';

const KIND_LABEL: Record<string, string> = {
  explanation: 'Explanation',
  example: 'Example',
  activity: 'Activity',
  check: 'Check',
};

export default function LessonReader() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { data: lesson, loading, error, reload } = useApi(() => api.lesson(lessonId));

  if (loading && !lesson) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Lesson' }} />
        <Loading />
      </Screen>
    );
  }

  if (error || !lesson) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Lesson' }} />
        <ErrorState
          title="Could not load this lesson"
          message={error ?? undefined}
          onRetry={reload}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: lesson.title }} />
      <Row style={{ justifyContent: 'flex-end' }}>
        <SaveToggle lessonId={lesson.id} saved={lesson.saved} />
      </Row>
      <Txt variant="body" c={color.inkSecondary}>
        {lesson.summary}
      </Txt>
      {lesson.sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          lessonId={lesson.id}
          saved={lesson.adaptations.filter((a) => a.sectionId === section.id)}
        />
      ))}
      <StudyWithMelda lessonId={lesson.id} />
    </Screen>
  );
}

function AdaptationNote({ label, body }: { label: string; body: string }) {
  return (
    <Card
      style={{ backgroundColor: color.accentSoft, borderColor: color.accentSoft, marginTop: sp.md }}
    >
      <Row gap={sp.xs}>
        <Icon name="sparkle" size={12} color={color.accentInk} />
        <Txt variant="tiny" c={color.accentInk} w={weight.bold}>
          MELDA - {label}
        </Txt>
      </Row>
      <Txt variant="body" c={color.inkSecondary} style={{ marginTop: sp.xs }}>
        {body}
      </Txt>
    </Card>
  );
}

function SectionCard(props: { section: LessonSection; lessonId: string; saved: Adaptation[] }) {
  const { section, lessonId, saved } = props;
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  // One tap does both halves of "I don't get this": fire the REQUEST_SIMPLER
  // signal the teacher's dashboard triages, AND get an instant section-grounded
  // answer back, so the student is never left with nothing while the teacher
  // (with MELDA) prepares a durable adaptation. The button's own spinner is the
  // "MELDA is explaining..." state.
  const askForHelp = async () => {
    setBusy(true);
    setFailed(null);
    try {
      const [, { answer: a }] = await Promise.all([
        api.recordSignal({
          type: 'REQUEST_SIMPLER',
          conceptId: section.conceptId,
          lessonId,
          sectionId: section.id,
          note: `Asked for a simpler take on "${section.title}"`,
        }),
        api.askMelda({
          lessonId,
          sectionId: section.id,
          question: `Can you explain "${section.title}" more simply?`,
        }),
      ]);
      setAnswer(a);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Could not reach MELDA. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Badge label={KIND_LABEL[section.kind] ?? section.kind} tone="neutral" />
      <Txt variant="h3" style={{ marginTop: sp.sm }}>
        {section.title}
      </Txt>
      <Txt variant="body" c={color.inkSecondary} style={{ marginTop: sp.xs }}>
        {section.body}
      </Txt>

      {saved.map((a) => (
        <AdaptationNote key={a.id} label={adaptationLabel[a.mode] ?? a.mode} body={a.body} />
      ))}

      {answer ? (
        <>
          <AdaptationNote label={adaptationLabel.simpler} body={answer} />
          <Row gap={sp.xs} style={{ marginTop: sp.md, alignItems: 'flex-start' }}>
            <Icon name="check" size={16} color={color.accentInk} />
            <Txt variant="small" c={color.accentInk} style={{ flex: 1 }}>
              MELDA let your teacher know. A simpler explanation will show up here.
            </Txt>
          </Row>
        </>
      ) : (
        <Button
          title="I don't get this"
          icon="question"
          variant="secondary"
          size="sm"
          loading={busy}
          style={{ marginTop: sp.md }}
          onPress={askForHelp}
        />
      )}
      {failed ? (
        <Txt variant="small" c={color.struggle} style={{ marginTop: sp.sm }}>
          {failed}
        </Txt>
      ) : null}
    </Card>
  );
}

// The Save/Saved toggle. The lesson payload already carries this student's
// saved-state (the backend joins it into GET /lessons/:id), so opening a lesson
// costs no extra request. The flip is optimistic with a revert if the write
// fails, and the label carries the state ("Saved" vs "Save lesson"), so it never
// relies on colour alone.
function SaveToggle({ lessonId, saved: initiallySaved }: { lessonId: string; saved: boolean }) {
  const [saved, setSaved] = useState<boolean>(initiallySaved);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    const next = !saved;
    setBusy(true);
    setSaved(next); // optimistic
    try {
      if (next) await api.saveLesson(lessonId);
      else await api.unsaveLesson(lessonId);
    } catch {
      setSaved(!next); // the write failed - put the toggle back
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      title={saved ? 'Saved' : 'Save lesson'}
      icon="bookmark"
      variant={saved ? 'primary' : 'secondary'}
      size="sm"
      loading={busy}
      onPress={toggle}
    />
  );
}

// "Study with MELDA": one ask box grounded in this lesson, with the Q&A history
// kept on THIS device (loadHistory / saveHistory) - never in the server DB. The
// server answers each ask statelessly, so this transcript is the only memory of
// what was asked.
function StudyWithMelda({ lessonId }: { lessonId: string }) {
  const [history, setHistory] = useState<AskTurn[]>([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadHistory(lessonId).then((h) => {
      if (alive) setHistory(h);
    });
    return () => {
      alive = false;
    };
  }, [lessonId]);

  const ask = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setFailed(null);
    try {
      const { answer } = await api.askMelda({ lessonId, question: q });
      const next = appendTurn(history, { question: q, answer });
      setHistory(next);
      setQuestion('');
      void saveHistory(lessonId, next);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Could not reach MELDA. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ backgroundColor: color.accentSoft, borderColor: color.accentSoft }}>
      <Row gap={sp.xs}>
        <Icon name="sparkle" size={16} color={color.accentInk} />
        <Txt variant="h3" c={color.accentInk}>
          Study with MELDA
        </Txt>
      </Row>
      <Txt variant="small" c={color.inkSecondary} style={{ marginTop: sp.xs }}>
        Ask anything about this lesson. MELDA answers from what you&apos;re reading.
      </Txt>

      {history.map((turn, i) => (
        <View key={i} style={{ marginTop: sp.md, gap: sp.xs }}>
          <Txt variant="small" w={weight.semibold}>
            You: {turn.question}
          </Txt>
          <Card style={{ backgroundColor: color.card }}>
            <Row gap={sp.xs} style={{ marginBottom: sp.xs }}>
              <Icon name="sparkle" size={12} color={color.accentInk} />
              <Txt variant="tiny" c={color.accentInk} w={weight.bold}>
                MELDA
              </Txt>
            </Row>
            <Txt variant="body" c={color.inkSecondary}>
              {turn.answer}
            </Txt>
          </Card>
        </View>
      ))}

      <Input
        value={question}
        onChangeText={setQuestion}
        placeholder="e.g. Can you explain this more simply?"
        multiline
        onSubmitEditing={ask}
        style={{ marginTop: sp.md }}
      />
      <Button
        title="Ask MELDA"
        icon="sparkle"
        loading={busy}
        disabled={!question.trim()}
        style={{ marginTop: sp.sm }}
        onPress={ask}
      />
      {failed ? (
        <Txt variant="small" c={color.struggle} style={{ marginTop: sp.sm }}>
          {failed}
        </Txt>
      ) : null}
    </Card>
  );
}
