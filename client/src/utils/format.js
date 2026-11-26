import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

export const formatDate = (d) => (d ? format(new Date(d), 'd MMM yyyy') : '');
export const formatDateTime = (d) => (d ? format(new Date(d), 'd MMM yyyy, HH:mm') : '');
export const timeAgo = (d) => (d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '');
export const toInputDate = (d) => (d ? format(new Date(d), 'yyyy-MM-dd') : '');

export function dueLabel(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isToday(date)) return 'Due today';
  if (isTomorrow(date)) return 'Due tomorrow';
  return isPast(date) ? `Overdue · ${format(date, 'd MMM')}` : `Due ${format(date, 'd MMM')}`;
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const initials = (name = '?') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

// Map server error.details[] onto { field: message } for forms
export const fieldErrors = (err) => Object.fromEntries((err?.details || []).map((d) => [d.field, d.message]));
