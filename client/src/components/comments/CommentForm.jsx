import { useState } from 'react';
import Button from '../common/Button';

export default function CommentForm({ onSubmit }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return setError('Write something first');
    setSaving(true);
    setError('');
    try {
      await onSubmit(text.trim());
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="comment" className="sr-only">
        Add a comment
      </label>
      <textarea
        id="comment"
        rows={2}
        maxLength={1000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && submit(e)}
        placeholder="Write a comment… (Ctrl/⌘ + Enter to send)"
        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={saving}>
          Comment
        </Button>
      </div>
    </form>
  );
}
