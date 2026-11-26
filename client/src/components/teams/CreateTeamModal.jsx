import { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Button from '../common/Button';
import { createTeam } from '../../api/teams';
import { fieldErrors } from '../../utils/format';

export default function CreateTeamModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setErrors({ name: 'Team name must be 2 to 60 characters' });
    setSaving(true);
    try {
      const res = await createTeam({ name: form.name.trim(), description: form.description.trim() });
      setForm({ name: '', description: '' });
      setErrors({});
      onCreated(res.data.team);
    } catch (err) {
      setErrors({ ...fieldErrors(err), form: err.message });
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New team"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-team" loading={saving}>
            Create team
          </Button>
        </>
      }
    >
      <form id="create-team" onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
        <Input label="Team name" name="name" value={form.name} onChange={onChange} error={errors.name} maxLength={60} placeholder="Syncora Core" />
        <TextArea label="Description" name="description" value={form.description} onChange={onChange} error={errors.description} maxLength={500} placeholder="What is this team working on?" />
        <p className="text-xs text-slate-500">You will be the owner. Add teammates by email afterwards.</p>
      </form>
    </Modal>
  );
}
