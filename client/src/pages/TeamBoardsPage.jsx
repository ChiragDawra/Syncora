import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useTeam from '../hooks/useTeam';
import useFetch from '../hooks/useFetch';
import { listBoards } from '../api/boards';
import BoardCard from '../components/boards/BoardCard';
import CreateBoardModal from '../components/boards/CreateBoardModal';
import MembersPanel from '../components/teams/MembersPanel';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Skeleton from '../components/common/Skeleton';

export default function TeamBoardsPage() {
  const { team, can, refetchTeam } = useTeam();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [showArchived, setShowArchived] = useState(false);
  // the sidebar's "+" opens this page with ?new=board
  const creating = params.get('new') === 'board' && can('board:create');
  const setCreating = (on) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (on) next.set('new', 'board');
      else next.delete('new');
      return next;
    });

  const { data: boards, loading, error, refetch } = useFetch(
    (cfg) => listBoards(team._id, { archived: showArchived ? 'true' : 'false' }, cfg),
    [team._id, showArchived]
  );

  const onCreated = (board) => {
    toast.success(`Board "${board.name}" created`);
    refetchTeam({ silent: true });
    navigate(`/boards/${board._id}`);
  };

  let content;
  if (loading) {
    content = (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  } else if (error) {
    content = <ErrorState title="Could not load boards" message={error.message} onRetry={refetch} />;
  } else if (!boards.length) {
    content = (
      <EmptyState
        icon="kanban"
        title={showArchived ? 'No archived boards' : 'No boards yet'}
        message={can('board:create') ? 'Boards hold your tasks. Create one for a sprint, a feature or the report.' : 'Ask the team owner or an admin to create a board.'}
        action={
          can('board:create') &&
          !showArchived && (
            <Button icon="plus" onClick={() => setCreating(true)}>
              Create a board
            </Button>
          )
        }
      />
    );
  } else {
    content = (
      <div className="grid gap-4 sm:grid-cols-2">
        {boards.map((b) => (
          <BoardCard key={b._id} board={b} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <section className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-ink">{showArchived ? 'Archived boards' : 'Boards'}</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon="archive" onClick={() => setShowArchived((s) => !s)}>
              {showArchived ? 'Show active' : 'Archived'}
            </Button>
            {can('board:create') && (
              <Button icon="plus" onClick={() => setCreating(true)}>
                New board
              </Button>
            )}
          </div>
        </div>
        {content}
      </section>
      <aside className="min-w-0">
        <MembersPanel />
      </aside>
      <CreateBoardModal teamId={team._id} open={creating} onClose={() => setCreating(false)} onCreated={onCreated} />
    </div>
  );
}
