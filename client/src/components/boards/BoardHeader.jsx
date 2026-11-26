import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useTeam from '../../hooks/useTeam';
import { deleteBoard, updateBoard } from '../../api/boards';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';
import Icon from '../common/Icon';
import ConfirmDialog from '../common/ConfirmDialog';
import EditBoardModal from './EditBoardModal';
import BoardStats from './BoardStats';

const iconBtn = 'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-slate-600 hover:bg-sunken hover:text-ink';

export default function BoardHeader({ board, stats, statsLoading, onBoardChange, onNewTask }) {
  const { team, can, refetchTeam } = useTeam();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleArchive = async () => {
    try {
      const res = await updateBoard(board._id, { archived: !board.archived });
      onBoardChange(res.data.board);
      refetchTeam({ silent: true });
      toast.success(res.data.board.archived ? 'Board archived' : 'Board restored');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onDelete = async () => {
    try {
      await deleteBoard(board._id);
      toast.success(`Board "${board.name}" deleted`);
      refetchTeam({ silent: true });
      navigate(`/teams/${team._id}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mb-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex min-w-0 items-center gap-1.5 text-[13px] text-slate-500" aria-label="Breadcrumb">
          <Link to={`/teams/${team._id}`} className="truncate hover:text-ink">
            {team.name}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="truncate font-medium text-ink">{board.name}</span>
        </nav>
        {/* phones use the floating button instead */}
        <div className="hidden md:block">
          <Button icon="plus" onClick={() => onNewTask('todo')}>
            New task
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: board.color }} aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{board.name}</h1>
            {board.description && <span className="hidden text-sm text-slate-500 sm:inline">{board.description}</span>}
            {board.archived && <Badge tone="amber">Archived</Badge>}
          </div>
          {board.description && <p className="mt-0.5 text-sm text-slate-500 sm:hidden">{board.description}</p>}
        </div>
        <div className="flex items-center gap-1">
          {can('board:update') && (
            <>
              <button type="button" className={iconBtn} onClick={() => setEditing(true)}>
                <Icon name="pencil" /> <span className="hidden sm:inline">Edit</span>
              </button>
              <button type="button" className={iconBtn} onClick={toggleArchive}>
                <Icon name="archive" /> <span className="hidden sm:inline">{board.archived ? 'Restore' : 'Archive'}</span>
              </button>
            </>
          )}
          {can('board:delete') && (
            <button type="button" className={`${iconBtn} hover:bg-red-50 hover:text-red-600`} onClick={() => setDeleting(true)} aria-label="Delete board">
              <Icon name="trash" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <BoardStats stats={stats} loading={statsLoading} />
        <div className="hidden items-center gap-2 text-[13px] text-slate-500 lg:flex">
          Team
          <div className="flex -space-x-2">
            {team.members.slice(0, 6).map((m) => (
              <Avatar key={m.user._id} user={m.user} size="sm" />
            ))}
          </div>
        </div>
      </div>

      <EditBoardModal
        board={board}
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={(b) => {
          setEditing(false);
          onBoardChange(b);
          refetchTeam({ silent: true });
          toast.success('Board updated');
        }}
      />
      <ConfirmDialog
        open={deleting}
        title="Delete this board?"
        message={`All ${stats?.total ?? ''} tasks on "${board.name}", with their comments and files, will be deleted.`}
        confirmText={board.name}
        confirmLabel="Delete board"
        onConfirm={onDelete}
        onClose={() => setDeleting(false)}
      />
    </div>
  );
}
