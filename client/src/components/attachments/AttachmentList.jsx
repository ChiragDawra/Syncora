import useAuth from '../../hooks/useAuth';
import useTeam from '../../hooks/useTeam';
import { canDeleteAttachment } from '../../utils/permissions';
import { formatBytes, timeAgo } from '../../utils/format';
import Icon from '../common/Icon';

const iconFor = (mime) => (mime.startsWith('image/') ? 'image' : 'file');
// in production the API lives on another domain: prefix /uploads with its origin
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

export default function AttachmentList({ attachments, onDelete }) {
  const { user } = useAuth();
  const { myRole } = useTeam();
  if (!attachments.length) return <p className="text-sm text-slate-500">No files yet.</p>;
  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-line">
      {attachments.map((a) => (
        <li key={a._id} className="flex items-center gap-3 px-3 py-2.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.mimeType === 'application/pdf' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
            <Icon name={iconFor(a.mimeType)} />
          </span>
          <div className="min-w-0 flex-1">
            <a href={`${API_ORIGIN}${a.url}`} target="_blank" rel="noreferrer" download={a.originalName} className="block truncate text-sm font-medium text-ink hover:text-indigo-700 hover:underline">
              {a.originalName}
            </a>
            <p className="text-xs text-slate-500">
              {formatBytes(a.size)} · {a.uploadedBy?.name || 'someone'} · {timeAgo(a.uploadedAt)}
            </p>
          </div>
          {canDeleteAttachment(myRole, user._id, a) && (
            <button type="button" onClick={() => onDelete(a)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${a.originalName}`}>
              <Icon name="trash" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
