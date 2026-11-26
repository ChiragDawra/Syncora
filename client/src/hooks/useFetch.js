import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Run an API call in useEffect. fn receives { signal } so stale requests are aborted.
 * Returns { data, meta, loading, error, refetch, setData }. refetch({ silent: true }) skips the spinner.
 */
export default function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);
  const silent = useRef(false);

  useEffect(() => {
    const ctrl = new AbortController();
    if (!silent.current) setState((s) => ({ ...s, loading: true, error: null }));
    silent.current = false;
    fn({ signal: ctrl.signal })
      .then((res) => {
        if (!ctrl.signal.aborted) setState({ data: res.data, meta: res.meta || null, loading: false, error: null });
      })
      .catch((err) => {
        if (!ctrl.signal.aborted) setState((s) => ({ ...s, loading: false, error: err }));
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refetch = useCallback((opts) => {
    silent.current = Boolean(opts?.silent);
    setNonce((n) => n + 1);
  }, []);

  const setData = useCallback(
    (updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })),
    []
  );

  return { ...state, refetch, setData };
}
