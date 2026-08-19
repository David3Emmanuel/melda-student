// A tiny read hook. It runs a fetcher when the screen gains focus - so the
// teacher's dashboard reflects a student's submission the instant they navigate
// back to it - and exposes {data, error, loading, reload}. Write actions (create,
// publish, adapt) call the client directly and then reload or navigate.

import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useApi<T>(fetcher: () => Promise<T>): ApiState<T> & { reload: () => void } {
  const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: true });
  // The fetcher is a fresh closure each render; keep the latest in a ref rather
  // than as a dependency. useFocusEffect re-runs on every focus, which is the
  // refresh we want, so nothing else needs to trigger a re-fetch.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fetcherRef
      .current()
      .then((data) => {
        if (alive) setState({ data, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (alive)
          setState((s) => ({
            ...s,
            error: err instanceof Error ? err.message : 'Something went wrong',
            loading: false,
          }));
      });
    return () => {
      alive = false;
    };
  }, []);

  useFocusEffect(load);
  return { ...state, reload: load };
}
