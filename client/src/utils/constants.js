export const STATUSES = ['todo', 'in_progress', 'done'];
export const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
export const SORT_OPTIONS = [
  { value: 'position', label: 'Board order' },
  { value: '-createdAt', label: 'Newest' },
  { value: 'createdAt', label: 'Oldest' },
  { value: 'dueDate', label: 'Due date (soonest)' },
  { value: '-dueDate', label: 'Due date (latest)' },
  { value: 'priority', label: 'Priority (urgent first)' },
];
export const BOARD_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b'];
export const MAX_FILE_MB = 5;
export const ALLOWED_FILE_TYPES = ['.png', '.jpg', '.jpeg', '.webp', '.pdf', '.docx', '.txt'];
