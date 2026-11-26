import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useTeam from '../hooks/useTeam';
import { deleteTeam, updateTeam } from '../api/teams';
import MembersPanel from '../components/teams/MembersPanel';
import Input from '../components/common/Input';
import TextArea from '../components/common/TextArea';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { fieldErrors } from '../utils/format';

export default function TeamSettingsPage() {
  const { team, can, refetchTeam } = useTeam();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: team.name, description: team.description || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const dirty = form.name !== team.name || form.description !== (team.description || '');

  const onSave = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setErrors({ name: 'Team name must be 2 to 60 characters' });
    setSaving(true);
    try {
      await updateTeam(team._id, { name: form.name.trim(), description: form.description.trim() });
      setErrors({});
      toast.success('Team updated');
      refetchTeam({ silent: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  const onDelete = async () => {
    try {
      await deleteTeam(team._id);
      toast.success(`Team "${team.name}" deleted`);
      navigate('/teams', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 space-y-6">
        <form onSubmit={onSave} noValidate className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Team details</h2>
          <Input label="Name" name="name" value={form.name} onChange={onChange} error={errors.name} maxLength={60} />
          <TextArea label="Description" name="description" value={form.description} onChange={onChange} error={errors.description} maxLength={500} />
          <div className="flex justify-end">
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save changes
            </Button>
          </div>
        </form>

        {can('team:delete') && (
          <section className="rounded-2xl border border-red-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-red-700">Danger zone</h2>
            <p className="mt-1 text-sm text-slate-600">Deleting the team removes all its boards, tasks, comments and files. This can't be undone.</p>
            <Button variant="danger" className="mt-3" onClick={() => setConfirmDelete(true)}>
              Delete team
            </Button>
          </section>
        )}
      </div>

      <MembersPanel manage />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this team?"
        message="All boards, tasks, comments, activity and attachments of this team will be permanently deleted."
        confirmText={team.name}
        confirmLabel="Delete team"
        onConfirm={onDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
