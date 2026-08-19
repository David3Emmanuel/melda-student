// The student's lesson reader. Each section shows any simpler explanations the
// teacher (with MELDA) has already saved for it. If a section still doesn't land,
// "I don't get this" posts a REQUEST_SIMPLER signal (POST /signals) - the exact
// record the teacher sees live on their dashboard, and what prompts them to add
// an adaptation here. On-demand AI is a teacher-only feature (the key and its
// cost stay on the server), so the student asks and the help comes back through
// the teacher, not straight from the model.

import { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { Adaptation, LessonSection } from 'melda-shared';
import { api } from '../../../src/api/client';
import { useApi } from '../../../src/api/useApi';
import { Badge, Button, Card, EmptyState, Loading, Screen, Txt } from '../../../src/ui/components';
import { adaptationLabel, color, sp, weight } from '../../../src/ui/tokens';

const KIND_LABEL: Record<string, string> = {
  explanation: 'Explanation',
  example: 'Example',
  activity: 'Activity',
  check: 'Check',
};

export default function LessonReader() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { data: lesson, loading, error } = useApi(() => api.lesson(lessonId));

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
        <EmptyState title="Could not load this lesson" body={error ?? undefined} icon="🔍" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: lesson.title }} />
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
    </Screen>
  );
}

function AdaptationNote({ label, body }: { label: string; body: string }) {
  return (
    <Card
      style={{ backgroundColor: color.accentSoft, borderColor: color.accentSoft, marginTop: sp.md }}
    >
      <Txt variant="tiny" c={color.accentInk} w={weight.bold}>
        ✨ MELDA - {label}
      </Txt>
      <Txt variant="body" c={color.inkSecondary} style={{ marginTop: sp.xs }}>
        {body}
      </Txt>
    </Card>
  );
}

function SectionCard(props: { section: LessonSection; lessonId: string; saved: Adaptation[] }) {
  const { section, lessonId, saved } = props;
  const [asked, setAsked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  // Tell the teacher this section didn't land. Recorded once per section; the
  // teacher's dashboard shows the REQUEST_SIMPLER signal live.
  const askForHelp = async () => {
    setBusy(true);
    setFailed(null);
    try {
      await api.recordSignal({
        type: 'REQUEST_SIMPLER',
        conceptId: section.conceptId,
        lessonId,
        sectionId: section.id,
        note: `Asked for a simpler take on "${section.title}"`,
      });
      setAsked(true);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Could not send that. Try again.');
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

      {asked ? (
        <Txt variant="small" c={color.accentInk} style={{ marginTop: sp.md }}>
          ✓ MELDA let your teacher know. A simpler explanation will show up here.
        </Txt>
      ) : (
        <Button
          title="I don't get this"
          icon="🤔"
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
