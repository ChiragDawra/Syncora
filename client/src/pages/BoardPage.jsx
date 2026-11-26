import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useParams, useSearchParams } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import useFetch from '../hooks/useFetch';
import useTeam from '../hooks/useTeam';
import useTasks from '../hooks/useTasks';
import useDebounce from '../hooks/useDebounce';
import { getBoard, getBoardStats } from '../api/boards';
import { TeamProvider } from '../context/TeamContext';
import BoardHeader from '../components/boards/BoardHeader';
import BoardFilters from '../components/boards/BoardFilters';
import KanbanColumn from '../components/tasks/KanbanColumn';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Button from '../components/common/Button';
import Icon from '../components/common/Icon';
import { FullPageSpinner } from '../components/common/Spinner';
import { STATUS_LABELS } from '../utils/constants';

const FILTER_KEYS = ['status', 'priority', 'assignee', 'label', 'overdue', 'q'];
const GRID = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' };

function BoardView({ board, onBoardChange }) {
  const { team } = useTeam();
  const [params, setParams] = useSearchParams();
  const [newTaskStatus, setNewTaskStatus] = useState(null);

  // filters, search and sort live in the URL
  const filters = useMemo(
    () => ({
      status: params.get('status') || '',
      priority: params.get('priority') || '',
      assignee: params.get('assignee') || '',
      label: params.get('label') || '',
      overdue: params.get('overdue') || '',
      q: params.get('q') || '',
      sort: params.get('sort') || 'position',
    }),
    [params]
  );

  const setFilter = useCallback(
    (patch) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
          if (patch.sort === 'position') next.delete('sort');
          return next;
        },
        { replace: true }
      ),
    [setParams]
  );

  // search box: type freely, write to the URL 400 ms after typing stops
  const [search, setSearch] = useState(filters.q);
  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => {
    if (debouncedSearch.trim() !== filters.q) setFilter({ q: debouncedSearch.trim() });
    // only react to the debounced value, not to URL changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { columns, visible, refresh, loadMore, createTask, moveTask, retry } = useTasks(board._id, filters);
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useFetch((cfg) => getBoardStats(board._id, cfg), [board._id]);

  // phones show one column at a time, picked with the segmented tabs
  const [mobileStatus, setMobileStatus] = useState('todo');
  const activeMobile = visible.includes(mobileStatus) ? mobileStatus : visible[0];

  const afterChange = useCallback(() => {
    refresh();
    refetchStats({ silent: true });
  }, [refresh, refetchStats]);

  const active = FILTER_KEYS.some((k) => filters[k]);
  const clearFilters = () => {
    setSearch('');
    setFilter(Object.fromEntries(FILTER_KEYS.map((k) => [k, ''])));
  };
  const dragDisabled = filters.sort !== 'position';

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const task = columns[source.droppableId].items.find((t) => t._id === draggableId);
    if (task && (await moveTask(task, destination.droppableId, destination.index))) refetchStats({ silent: true });
  };

  const onMove = async (task, status) => {
    if (status === task.status) return;
    if (await moveTask(task, status)) {
      toast.success(`Moved to ${STATUS_LABELS[status]}`);
      refetchStats({ silent: true });
    }
  };

  const onCreate = async (body) => {
    await createTask(body);
    toast.success('Task created');
    setNewTaskStatus(null);
    refetchStats({ silent: true });
  };

  const allLoaded = visible.every((s) => !columns[s].loading);
  const totalShown = visible.reduce((n, s) => n + (columns[s].meta?.total || 0), 0);

  return (
    <div>
      <BoardHeader board={board} stats={stats} statsLoading={statsLoading} onBoardChange={onBoardChange} onNewTask={setNewTaskStatus} />
      <BoardFilters filters={filters} search={search} onSearch={setSearch} onChange={setFilter} onClear={clearFilters} members={team.members} active={active} />
      {dragDisabled && <p className="mt-2 hidden text-xs text-slate-500 md:block">Drag and drop works in &quot;Board order&quot;. Use the status menu on a card to move it.</p>}

      {allLoaded && totalShown === 0 && (
        <div className="mt-4">
          {active ? (
            <EmptyState
              icon="search"
              title="No tasks match these filters"
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
              compact
            />
          ) : (
            <EmptyState
              icon="sparkles"
              title="No tasks yet"
              message="Add the first one and assign it to a teammate."
              action={
                <Button icon="plus" onClick={() => setNewTaskStatus('todo')}>
                  Add a task
                </Button>
              }
              compact
            />
          )}
        </div>
      )}

      {/* phones: segmented control picks the visible column */}
      {visible.length > 1 && (
        <div className="sticky top-14 z-20 -mx-4 mt-4 bg-canvas/90 px-4 py-2 backdrop-blur-md md:hidden">
          <div className="flex gap-1 rounded-xl border border-line bg-sunken p-1" role="tablist" aria-label="Columns">
            {visible.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={activeMobile === s}
                onClick={() => setMobileStatus(s)}
                className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition ${
                  activeMobile === s ? 'bg-white text-indigo-700 shadow-card' : 'text-slate-500'
                }`}
              >
                {STATUS_LABELS[s]}
                <span className={`rounded-full px-1.5 text-[10px] font-semibold ${activeMobile === s ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-slate-500'}`}>
                  {columns[s].meta?.total ?? '–'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className={`mt-2 grid items-start gap-4 md:mt-5 ${GRID[visible.length]}`}>
          {visible.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              column={columns[status]}
              boardId={board._id}
              onMove={onMove}
              onLoadMore={loadMore}
              onRetry={retry}
              onAdd={setNewTaskStatus}
              dragDisabled={dragDisabled}
              className={`${status === activeMobile ? 'flex' : 'hidden'} md:flex`}
            />
          ))}
        </div>
      </DragDropContext>

      {/* phones: floating "New task" in the thumb zone, above the tab bar */}
      <button
        type="button"
        onClick={() => setNewTaskStatus(activeMobile || 'todo')}
        className="fixed bottom-20 right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white shadow-dialog active:scale-95 md:hidden"
      >
        <Icon name="plus" className="h-5 w-5" /> New task
      </button>

      <CreateTaskModal
        open={Boolean(newTaskStatus)}
        initialStatus={newTaskStatus || 'todo'}
        members={team.members}
        onClose={() => setNewTaskStatus(null)}
        onCreate={onCreate}
      />
      <Outlet context={{ board, onTaskChanged: afterChange }} />
    </div>
  );
}

export default function BoardPage() {
  const { boardId } = useParams();
  const { data, loading, error, refetch, setData } = useFetch((cfg) => getBoard(boardId, cfg), [boardId]);

  if (loading && !data) return <FullPageSpinner label="Loading board" />;
  if (error) {
    const title =
      error.status === 403
        ? "You don't have access to this board"
        : error.status === 404 || error.code === 'INVALID_ID'
          ? 'Board not found'
          : 'Could not load the board';
    return (
      <ErrorState
        title={title}
        message={error.status === 403 ? 'Only members of this team can open its boards.' : error.message}
        onRetry={!error.status || error.status >= 500 ? refetch : undefined}
        backTo="/teams"
      />
    );
  }

  const { board } = data;
  // the board's team decides my role on this page
  return (
    <TeamProvider teamId={board.team} key={board.team}>
      <BoardView board={board} onBoardChange={(b) => setData({ board: b })} />
    </TeamProvider>
  );
}
