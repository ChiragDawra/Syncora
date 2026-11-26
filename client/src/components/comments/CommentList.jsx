import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import useTeam from '../../hooks/useTeam';
import useFetch from '../../hooks/useFetch';
import { addComment, deleteComment, editComment, listComments } from '../../api/comments';
import { canDeleteComment } from '../../utils/permissions';
import { formatDateTime, timeAgo } from '../../utils/format';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import ErrorState from '../common/ErrorState';
import CommentForm from './CommentForm';

export default function CommentList({ taskId, onChange }) {
  const { user } = useAuth();
  const { myRole } = useTeam();
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, refetch } = useFetch((cfg) => listComments(taskId, { page, limit: 10 }, cfg), [taskId, page]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  const add = async (text) => {
    await addComment(taskId, text);
    setPage(1);
    refetch({ silent: true });
    onChange?.();
  };

  const saveEdit = async (c) => {
    try {
      await editComment(c._id, draft.trim());
      setEditingId(null);
      refetch({ silent: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (c) => {
    try {
      await deleteComment(c._id);
      toast.success('Comment deleted');
      refetch({ silent: true });
      onChange?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">Comments {meta ? `(${meta.total})` : ''}</h3>
      <CommentForm onSubmit={add} />
      <div className="mt-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorState compact title="Could not load comments" message={error.message} onRetry={refetch} />
        ) : !data.length ? (
          <p className="py-3 text-center text-sm text-slate-500">No comments yet. Start the discussion.</p>
        ) : (
          <ul className="space-y-3">
            {data.map((c) => (
              <li key={c._id} className="flex gap-2.5">
                <Avatar user={c.author} size="sm" />
                <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900">{c.author?.name || 'Deleted user'}</span>
                    <time className="text-xs text-slate-500" title={formatDateTime(c.createdAt)}>
                      {timeAgo(c.createdAt)}
                      {c.edited && ' · edited'}
                    </time>
                  </div>
                  {editingId === c._id ? (
                    <div className="mt-1 space-y-2">
                      <textarea
                        aria-label="Edit comment"
                        value={draft}
                        maxLength={1000}
                        onChange={(e) => setDraft(e.target.value)}
                        className="block w-full rounded border border-slate-300 p-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(c)} disabled={!draft.trim()}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">{c.text}</p>
                  )}
                  <div className="mt-1 flex gap-3 text-xs">
                    {c.author?._id === user._id && editingId !== c._id && (
                      <button
                        type="button"
                        className="text-slate-500 hover:text-slate-800"
                        onClick={() => {
                          setEditingId(c._id);
                          setDraft(c.text);
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {canDeleteComment(myRole, user._id, c) && (
                      <button type="button" className="text-red-500 hover:text-red-700" onClick={() => remove(c)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {meta && meta.totalPages > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Newer
            </Button>
            <Button size="sm" variant="secondary" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>
              Older
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
