// The student's home. Two lists: the reviews they have been set (each showing
// their own status and score, never a classmate's) and the lessons they can read.
// Both come from the backend scoped to this student (GET /classes/:id/assignments
// and /lessons); useApi refetches on focus, so a score appears here the moment a
// submitted quiz sends them back.

import { useRouter } from 'expo-router';
import { api } from '../../src/api/client';
import { useApi } from '../../src/api/useApi';
import { useSession } from '../../src/state/store';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  Loading,
  Row,
  Screen,
  Txt,
} from '../../src/ui/components';
import { color, dueLabel, sp, toneStyle, weight } from '../../src/ui/tokens';

export default function StudentHome() {
  const router = useRouter();
  const classId = useSession((s) => s.currentClass?.id) ?? '';
  const className = useSession((s) => s.currentClass?.name);
  const name = useSession((s) => s.user?.name);
  const signOut = useSession((s) => s.signOut);
  const firstName = name?.split(' ')[0] ?? 'there';

  const { data, loading, error, reload } = useApi(async () => {
    const [assignments, lessons] = await Promise.all([
      api.assignments(classId),
      api.lessons(classId),
    ]);
    return { assignments, lessons };
  });

  const right = <Button title="Sign out" variant="ghost" size="sm" onPress={signOut} />;

  return (
    <Screen title={`Hi, ${firstName}`} subtitle={className} right={right}>
      {loading && !data ? <Loading /> : null}

      {error ? (
        <ErrorState title="Could not load your work" message={error} onRetry={reload} />
      ) : null}

      {data ? (
        <>
          <Txt variant="h3">Your reviews</Txt>
          {data.assignments.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              body="When your teacher sets one, it shows up here."
              icon="reviews"
            />
          ) : (
            data.assignments.map(({ assignment, submitted, scorePct }) => {
              const due = dueLabel(assignment.dueAt);
              return (
                <Card
                  key={assignment.id}
                  onPress={() => router.push(`/(student)/quiz/${assignment.id}`)}
                >
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Badge
                      label={submitted ? 'Submitted' : 'To do'}
                      tone={submitted ? 'ok' : 'warn'}
                      dot
                    />
                    {submitted && scorePct !== null ? (
                      <Txt variant="tiny" c={color.inkMuted}>
                        Scored {scorePct}%
                      </Txt>
                    ) : null}
                  </Row>
                  <Txt variant="h3" style={{ marginTop: sp.sm }}>
                    {assignment.title}
                  </Txt>
                  <Row style={{ justifyContent: 'space-between', marginTop: 2 }}>
                    <Txt variant="small" c={color.inkMuted}>
                      {assignment.questions.length} questions
                    </Txt>
                    {due.text ? (
                      <Txt variant="small" w={weight.semibold} c={toneStyle(due.tone).fg}>
                        {due.text}
                      </Txt>
                    ) : null}
                  </Row>
                  <Button
                    title={submitted ? 'Retake the review' : 'Start the review'}
                    icon="pencil"
                    size="sm"
                    style={{ marginTop: sp.md }}
                    onPress={() => router.push(`/(student)/quiz/${assignment.id}`)}
                  />
                </Card>
              );
            })
          )}

          <Txt variant="h3" style={{ marginTop: sp.sm }}>
            Your lessons
          </Txt>
          {data.lessons.length === 0 ? (
            <EmptyState
              title="No lessons yet"
              body="Your teacher's published lessons will appear here."
              icon="book"
            />
          ) : (
            data.lessons.map((l) => (
              <Card key={l.id} onPress={() => router.push(`/(student)/lesson/${l.id}`)}>
                <Txt variant="h3">{l.title}</Txt>
                <Txt variant="small" c={color.inkMuted} numberOfLines={2} style={{ marginTop: 2 }}>
                  {l.summary}
                </Txt>
                {l.adaptations.length ? (
                  <Row gap={sp.xs} style={{ marginTop: sp.sm }}>
                    <Icon name="sparkle" size={12} color={color.accentInk} />
                    <Txt variant="tiny" c={color.accentInk}>
                      {l.adaptations.length} MELDA explanation{l.adaptations.length > 1 ? 's' : ''}
                    </Txt>
                  </Row>
                ) : null}
              </Card>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}
