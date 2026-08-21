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

export function useApi<T>(
  fetcher: () => Promise<T>,
): ApiState<T> & { reload: () => Promise<void> } {
  const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: true });
  // The fetcher is a fresh closure each render; keep the latest in a ref rather
  // than as a dependency. useFocusEffect re-runs on every focus, which is the
  // refresh we want, so nothing else needs to trigger a re-fetch.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  // Flipped false when the screen blurs/unmounts, so a slow fetch that lands
  // after we have navigated away never calls setState on a screen that is gone.
  const aliveRef = useRef(true);

  // Returns the fetch Promise so a pull-to-refresh (Screen's RefreshControl) can
  // await it and keep the spinner up until the fresh data actually lands.
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    return fetcherRef
      .current()
      .then((data) => {
        if (aliveRef.current) setState({ data, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (aliveRef.current)
          setState((s) => ({
            ...s,
            error: err instanceof Error ? err.message : 'Something went wrong',
            loading: false,
          }));
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      aliveRef.current = true;
      void load();
      return () => {
        aliveRef.current = false;
      };
    }, [load]),
  );

  return { ...state, reload: load };
}
