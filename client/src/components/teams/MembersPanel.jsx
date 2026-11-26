import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import useTeam from '../../hooks/useTeam';
import useWorkspace from '../../hooks/useWorkspace';
import { changeRole, removeMember } from '../../api/teams';
import ConfirmDialog from '../common/ConfirmDialog';
import MemberRow from './MemberRow';
import InviteForm from './InviteForm';

const ROLE_ORDER = { owner: 0, admin: 1, member: 2 };

// manage = settings page (role select, remove buttons); otherwise a read-only list + invite form
export default function MembersPanel({ manage = false }) {
  const { user } = useAuth();
  const { team, can, refetchTeam } = useTeam();
  const { setTeamId } = useWorkspace();
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(null);

  const members = [...team.members].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.user.name.localeCompare(b.user.name));

  const onRoleChange = async (member, role) => {
    try {
      await changeRole(team._id, member.user._id, role);
      toast.success(`${member.user.name} is now ${role === 'admin' ? 'an admin' : 'a member'}`);
      refetchTeam({ silent: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmRemove = async () => {
    const leaving = removing.user._id === user._id;
    try {
      await removeMember(team._id, removing.user._id);
      setRemoving(null);
      if (leaving) {
        toast.success(`You left ${team.name}`);
        setTeamId(null);
        navigate('/teams');
      } else {
        toast.success(`${removing.user.name} removed`);
        refetchTeam({ silent: true });
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="min-w-0 rounded-2xl border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Members</h2>
        <span className="rounded-full bg-sunken px-2 text-xs font-medium tabular-nums text-slate-500">{members.length}</span>
      </div>
      <ul className="divide-y divide-slate-100 px-4">
        {members.map((m) => (
          <MemberRow key={m.user._id} member={m} manage={manage} onRoleChange={onRoleChange} onRemove={setRemoving} />
        ))}
      </ul>
      {can('member:add') && (
        <div className="border-t border-line px-4 py-4">
          <h3 className="micro-caps mb-2 text-slate-400">Add a teammate</h3>
          <InviteForm />
        </div>
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        title={removing?.user._id === user._id ? 'Leave team?' : 'Remove member?'}
        message={
          removing?.user._id === user._id
            ? `You will lose access to ${team.name} and its boards.`
            : `${removing?.user.name} will lose access to this team. Their tasks become unassigned.`
        }
        confirmLabel={removing?.user._id === user._id ? 'Leave' : 'Remove'}
        onConfirm={confirmRemove}
        onClose={() => setRemoving(null)}
      />
    </section>
  );
}
