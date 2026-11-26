import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import useUpload from '../../hooks/useUpload';
import { uploadAttachments } from '../../api/attachments';
import { ALLOWED_FILE_TYPES, MAX_FILE_MB } from '../../utils/constants';
import ProgressBar from '../common/ProgressBar';
import Button from '../common/Button';

// Check size and type in the browser first (the server checks again with Multer)
function checkFiles(files) {
  if (files.length > 5) return 'Pick at most 5 files at a time';
  for (const f of files) {
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(ext)) return `${f.name}: type not allowed (${ALLOWED_FILE_TYPES.join(', ')})`;
    if (f.size > MAX_FILE_MB * 1024 * 1024) return `${f.name} is over ${MAX_FILE_MB} MB`;
  }
  return '';
}

export default function AttachmentUploader({ taskId, onUploaded }) {
  const input = useRef(null);
  const { upload, progress, uploading } = useUpload();
  const [error, setError] = useState('');

  const onPick = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    const problem = checkFiles(files);
    if (problem) return setError(problem);
    setError('');
    try {
      const res = await upload((onProgress) => uploadAttachments(taskId, files, onProgress));
      toast.success(`${res.data.attachments.length} file${res.data.attachments.length > 1 ? 's' : ''} uploaded`);
      onUploaded?.(res.data.attachments);
    } catch (err) {
      setError(err.message);
    }
    return undefined;
  };

  return (
    <div className="space-y-2">
      <input ref={input} type="file" multiple accept={ALLOWED_FILE_TYPES.join(',')} onChange={onPick} className="hidden" aria-label="Choose files" />
      <Button variant="secondary" size="sm" icon="paperclip" onClick={() => input.current.click()} loading={uploading}>
        Attach files
      </Button>
      <p className="text-xs text-slate-500">
        Up to 5 files, {MAX_FILE_MB} MB each: PNG, JPG, WEBP, PDF, DOCX, TXT
      </p>
      {uploading && <ProgressBar value={progress} label="Uploading" />}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
