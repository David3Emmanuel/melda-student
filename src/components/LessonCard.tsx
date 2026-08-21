// One lesson, as a tappable card - the same card the Home and Saved tabs both
// list, so it lives here once. Tapping opens the reader. Shows the MELDA
// explanation count when the teacher has added any, the student's cue that there
// is extra help inside.

import { useRouter } from 'expo-router';
import type { Lesson } from 'melda-shared';
import { Card, Icon, Row, Txt } from '../ui/components';
import { color, sp } from '../ui/tokens';

export function LessonCard({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  return (
    <Card onPress={() => router.push(`/(student)/lesson/${lesson.id}`)}>
      <Txt variant="h3">{lesson.title}</Txt>
      <Txt variant="small" c={color.inkMuted} numberOfLines={2} style={{ marginTop: 2 }}>
        {lesson.summary}
      </Txt>
      {lesson.adaptations.length ? (
        <Row gap={sp.xs} style={{ marginTop: sp.sm }}>
          <Icon name="sparkle" size={12} color={color.accentInk} />
          <Txt variant="tiny" c={color.accentInk}>
            {lesson.adaptations.length} MELDA explanation{lesson.adaptations.length > 1 ? 's' : ''}
          </Txt>
        </Row>
      ) : null}
    </Card>
  );
}
