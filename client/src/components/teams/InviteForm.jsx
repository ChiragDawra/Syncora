import { useState } from 'react';
import toast from 'react-hot-toast';
import { addMember } from '../../api/teams';
import useTeam from '../../hooks/useTeam';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

export default function InviteForm() {
  const { team, can, refetchTeam } = useTeam();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email');
    setSaving(true);
    setError('');
    try {
      await addMember(team._id, { email: email.trim(), role });
      toast.success(`${email.trim()} added`);
      setEmail('');
      setRole('member');
      refetchTeam({ silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Input
          className="flex-1"
          name="invite-email"
          type="email"
          aria-label="Teammate email"
          placeholder="teammate@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />
        {can('member:addAdmin') && (
          <Select
            name="invite-role"
            aria-label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'member', label: 'Member' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
        )}
        <Button type="submit" loading={saving}>
          Add
        </Button>
      </div>
      <p className="text-xs text-slate-500">They need a Syncora account with this email first.</p>
    </form>
  );
}
