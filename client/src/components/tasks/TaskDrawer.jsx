import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import useTeam from '../../hooks/useTeam';
import useFetch from '../../hooks/useFetch';
import { deleteTask, getTask, moveTask, updateTask } from '../../api/tasks';
import { deleteAttachment } from '../../api/attachments';
import { canDeleteTask } from '../../utils/permissions';
import { STATUSES, STATUS_LABELS } from '../../utils/constants';
import { fieldErrors, formatDateTime, timeAgo } from '../../utils/format';
import TaskForm, { taskToForm, validateTask } from './TaskForm';
import PriorityBadge from './PriorityBadge';
import DueDateBadge from './DueDateBadge';
import CommentList from '../comments/CommentList';
import AttachmentList from '../attachments/AttachmentList';
import AttachmentUploader from '../attachments/AttachmentUploader';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import ErrorState from '../common/ErrorState';
import ConfirmDialog from '../common/ConfirmDialog';

// Nested route /boards/:boardId/tasks/:taskId: the task opens over the board, and the URL can be shared
export default function TaskDrawer() {
  const { boardId, taskId } = useParams();
  const { onTaskChanged } = useOutletContext();
  const { team, myRole } = useTeam();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { data, loading, error, refetch, setData } = useFetch((cfg) => getTask(taskId, cfg), [taskId]);
  const task = data?.task;

  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (task) setForm(taskToForm(task));
  }, [task]);

  const close = () => navigate(`/boards/${boardId}${search}`);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !document.querySelector('[role="dialog"][aria-modal="true"]') && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const dirty = task && form && JSON.stringify(form) !== JSON.stringify(taskToForm(task));

  const save = async (e) => {
    e.preventDefault();
    const errs = validateTask(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const { title, description, priority, assignee, dueDate, labels } = form;
      const res = await updateTask(task._id, { title: title.trim(), description: description.trim(), priority, assignee, dueDate: dueDate || null, labels });
      setData({ task: res.data.task });
      toast.success('Task saved');
      onTaskChanged();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status) => {
    try {
      const res = await moveTask(task._id, { status });
      setData({ task: res.data.task });
      toast.success(`Moved to ${STATUS_LABELS[status]}`);
      onTaskChanged();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    try {
      await deleteTask(task._id);
      toast.success('Task deleted');
      onTaskChanged();
      close();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeAttachment = async (a) => {
    try {
      await deleteAttachment(task._id, a._id);
      toast.success(`${a.originalName} deleted`);
      refetch({ silent: true });
      onTaskChanged();
    } catch (err) {
      toast.error(err.message);
    }
  };

  let body;
  if (loading && !task) {
    body = (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  } else if (error) {
    const title = error.status === 404 ? 'Task not found' : error.status === 403 ? "You don't have access to this task" : 'Could not load the task';
    body = <ErrorState title={title} message={error.message} onRetry={refetch} />;
  } else if (task && form) {
    body = (
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Status"
            value={task.status}
            onChange={(e) => changeStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <PriorityBadge priority={task.priority} />
          <DueDateBadge task={task} />
          {task.completedAt && <span className="text-xs text-emerald-700">Completed {timeAgo(task.completedAt)}</span>}
        </div>

        <form onSubmit={save} noValidate className="space-y-4">
          <TaskForm form={form} setForm={setForm} errors={errors} members={team.members} />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              Created by {task.createdBy?.name || 'someone'} · {formatDateTime(task.createdAt)}
            </p>
            <div className="flex gap-2">
              {dirty && (
                <Button variant="ghost" onClick={() => setForm(taskToForm(task))}>
                  Discard
                </Button>
              )}
              <Button type="submit" loading={saving} disabled={!dirty}>
                Save changes
              </Button>
            </div>
          </div>
        </form>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Attachments ({task.attachments.length})</h3>
          <AttachmentList attachments={task.attachments} onDelete={removeAttachment} />
          <AttachmentUploader
            taskId={task._id}
            onUploaded={() => {
              refetch({ silent: true });
              onTaskChanged();
            }}
          />
        </section>

        <CommentList taskId={task._id} onChange={onTaskChanged} />

        {canDeleteTask(myRole, user._id, task) && (
          <div className="border-t border-slate-200 pt-4">
            <Button variant="danger-ghost" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete task
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={close} aria-hidden="true" />
      <aside aria-label="Task details" className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">{task?.board?.name}</p>
            <h2 className="truncate text-lg font-semibold text-slate-900">{task?.title || 'Task'}</h2>
          </div>
          <button type="button" onClick={close} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close task">
            ✕
          </button>
        </header>
        {body}
      </aside>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this task?"
        message="Its comments and attached files are deleted too."
        confirmLabel="Delete task"
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
