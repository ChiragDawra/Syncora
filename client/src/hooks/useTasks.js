import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import * as tasksApi from '../api/tasks';
import { STATUSES } from '../utils/constants';

const COLUMN_LIMIT = 50;
const emptyColumn = { items: [], meta: null, loading: true, error: null };

/**
 * Board data: each column (status) loads its first 50 tasks with "Load more".
 * filters = { priority, assignee, label, overdue, q, sort, status } from the URL.
 */
export default function useTasks(boardId, filters) {
  const visible = useMemo(() => (filters.status ? filters.status.split(',') : STATUSES), [filters.status]);
  const [columns, setColumns] = useState(() => Object.fromEntries(STATUSES.map((s) => [s, emptyColumn])));
  const filterKey = JSON.stringify(filters);
  const latest = useRef({});

  const fetchColumn = useCallback(
    async (status, { page = 1, append = false, silent = false } = {}) => {
      const reqId = Symbol(status);
      latest.current[status] = reqId; // ignore responses that arrive after a newer request
      if (!silent) setColumns((c) => ({ ...c, [status]: { ...c[status], loading: true, error: null } }));
      const { status: _ignored, ...rest } = filters;
      const params = Object.fromEntries(Object.entries({ ...rest, status, limit: COLUMN_LIMIT, page }).filter(([, v]) => v !== '' && v != null));
      try {
        const res = await tasksApi.listTasks(boardId, params);
        if (latest.current[status] !== reqId) return;
        setColumns((c) => ({
          ...c,
          [status]: { items: append ? [...c[status].items, ...res.data] : res.data, meta: res.meta, loading: false, error: null },
        }));
      } catch (err) {
        if (latest.current[status] !== reqId) return;
        setColumns((c) => ({ ...c, [status]: { ...c[status], loading: false, error: err } }));
      }
    },
    // filterKey captures every filter value
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boardId, filterKey]
  );

  useEffect(() => {
    visible.forEach((s) => fetchColumn(s));
  }, [fetchColumn, visible]);

  const refresh = useCallback((statuses = visible) => statuses.forEach((s) => fetchColumn(s, { silent: true })), [fetchColumn, visible]);

  const loadMore = useCallback(
    (status) => {
      const meta = columns[status].meta;
      if (meta?.hasNext) fetchColumn(status, { page: meta.page + 1, append: true, silent: true });
    },
    [columns, fetchColumn]
  );

  const createTask = useCallback(
    async (body) => {
      const res = await tasksApi.createTask(boardId, body);
      refresh([res.data.task.status].filter((s) => visible.includes(s)));
      return res.data.task;
    },
    [boardId, refresh, visible]
  );

  /**
   * Optimistic move: update the columns first, call the API, roll back on error.
   * position = position of the card we drop in front of (or after the last card).
   */
  const moveTask = useCallback(
    async (task, toStatus, toIndex) => {
      const snapshot = columns;
      const dest = snapshot[toStatus].items.filter((t) => t._id !== task._id);
      const index = toIndex === undefined ? dest.length : Math.min(toIndex, dest.length);
      let position;
      if (toIndex !== undefined) position = index < dest.length ? dest[index].position : dest.length ? dest[dest.length - 1].position + 1 : undefined;

      setColumns((c) => {
        const next = { ...c };
        next[task.status] = { ...c[task.status], items: c[task.status].items.filter((t) => t._id !== task._id) };
        const items = [...(task.status === toStatus ? next[toStatus].items : c[toStatus].items)];
        items.splice(index, 0, { ...task, status: toStatus, isOverdue: toStatus === 'done' ? false : task.isOverdue });
        next[toStatus] = { ...c[toStatus], items };
        return next;
      });

      try {
        await tasksApi.moveTask(task._id, position === undefined ? { status: toStatus } : { status: toStatus, position });
        refresh([...new Set([task.status, toStatus])].filter((s) => visible.includes(s)));
        return true;
      } catch (err) {
        setColumns(snapshot); // roll back
        toast.error(err.message || 'Could not move the task');
        return false;
      }
    },
    [columns, refresh, visible]
  );

  return { columns, visible, refresh, loadMore, createTask, moveTask, retry: fetchColumn };
}
