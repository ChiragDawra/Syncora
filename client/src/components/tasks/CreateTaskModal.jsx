import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import TaskForm, { emptyTask, validateTask } from './TaskForm';
import { fieldErrors } from '../../utils/format';

export default function CreateTaskModal({ open, initialStatus = 'todo', members, onClose, onCreate }) {
  const [form, setForm] = useState(emptyTask(initialStatus));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(emptyTask(initialStatus));
      setErrors({});
    }
  }, [open, initialStatus]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validateTask(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await onCreate({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate || null,
      });
    } catch (err) {
      setErrors({ ...fieldErrors(err), form: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-task" loading={saving}>
            Create task
          </Button>
        </>
      }
    >
      <form id="create-task" onSubmit={onSubmit} noValidate>
        {errors.form && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{errors.form}</p>}
        <TaskForm form={form} setForm={setForm} errors={errors} members={members} showStatus />
      </form>
    </Modal>
  );
}
