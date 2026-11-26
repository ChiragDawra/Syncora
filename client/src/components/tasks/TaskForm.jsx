import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Select from '../common/Select';
import AssigneeSelect from './AssigneeSelect';
import LabelInput from './LabelInput';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../../utils/constants';
import { toInputDate } from '../../utils/format';

export const emptyTask = (status = 'todo') => ({ title: '', description: '', status, priority: 'medium', assignee: null, dueDate: '', labels: [] });

export const taskToForm = (t) => ({
  title: t.title,
  description: t.description || '',
  status: t.status,
  priority: t.priority,
  assignee: t.assignee?._id || null,
  dueDate: toInputDate(t.dueDate),
  labels: t.labels || [],
});

export function validateTask(form) {
  const errs = {};
  const title = form.title.trim();
  if (title.length < 3 || title.length > 120) errs.title = 'Title must be 3 to 120 characters';
  if (form.description.length > 2000) errs.description = 'At most 2000 characters';
  return errs;
}

// Controlled task fields, shared by "new task" and the task drawer
export default function TaskForm({ form, setForm, errors = {}, members, showStatus = false }) {
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const onChange = (e) => set(e.target.name)(e.target.value);
  const today = toInputDate(new Date());

  return (
    <div className="space-y-4">
      <Input label="Title" name="title" value={form.title} onChange={onChange} error={errors.title} maxLength={120} placeholder="Build login API" />
      <TextArea label="Description" name="description" value={form.description} onChange={onChange} error={errors.description} maxLength={2000} rows={4} />
      <div className="grid gap-4 sm:grid-cols-2">
        {showStatus && (
          <Select label="Status" name="status" value={form.status} onChange={onChange} options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))} />
        )}
        <Select label="Priority" name="priority" value={form.priority} onChange={onChange} options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))} />
        <AssigneeSelect members={members} value={form.assignee} onChange={set('assignee')} error={errors.assignee} />
        <Input
          label="Due date"
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={onChange}
          error={errors.dueDate}
          hint={form.dueDate && form.dueDate < today ? 'Heads up: this date is in the past' : undefined}
        />
      </div>
      <LabelInput value={form.labels} onChange={set('labels')} error={errors.labels} />
    </div>
  );
}
