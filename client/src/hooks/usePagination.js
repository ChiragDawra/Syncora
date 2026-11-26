import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// Page number lives in the URL (?page=2) so refresh, back and shared links keep it
export default function usePagination(meta) {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setPage = useCallback(
    (p) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (p <= 1) next.delete('page');
        else next.set('page', String(p));
        return next;
      });
    },
    [setParams]
  );

  return { page, setPage, hasNext: Boolean(meta?.hasNext), hasPrev: page > 1, totalPages: meta?.totalPages || 1 };
}
