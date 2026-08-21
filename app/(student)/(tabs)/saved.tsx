// The student's Saved tab: the lessons they bookmarked in the reader, newest save
// first (the server sorts, and drops any lesson later unpublished). useApi
// refetches on focus, so a lesson saved or unsaved in the reader is reflected the
// moment the student taps back here.

import { api } from '../../../src/api/client';
import { useApi } from '../../../src/api/useApi';
import { LessonCard } from '../../../src/components/LessonCard';
import { EmptyState, ErrorState, Loading, Screen } from '../../../src/ui/components';

export default function SavedLessons() {
  const { data, loading, error, reload } = useApi(() => api.savedLessons());

  return (
    <Screen title="Saved" onRefresh={reload}>
      {loading && !data ? <Loading /> : null}

      {error ? (
        <ErrorState title="Could not load your saved lessons" message={error} onRetry={reload} />
      ) : null}

      {data ? (
        data.length === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            body="Open a lesson and tap Save to keep it here."
            icon="bookmark"
          />
        ) : (
          data.map((l) => <LessonCard key={l.id} lesson={l} />)
        )
      ) : null}
    </Screen>
  );
}
