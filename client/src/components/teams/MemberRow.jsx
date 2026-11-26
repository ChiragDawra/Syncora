import useAuth from '../../hooks/useAuth';
import useTeam from '../../hooks/useTeam';
import { canRemoveMember } from '../../utils/permissions';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import RoleBadge from './RoleBadge';

export default function MemberRow({ member, manage, onRoleChange, onRemove }) {
  const { user } = useAuth();
  const { myRole, can } = useTeam();
  const isMe = member.user._id === user._id;
  const showRoleSelect = manage && can('member:changeRole') && member.role !== 'owner';
  const removable = manage && canRemoveMember(myRole, user._id, member);

  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar user={member.user} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          {member.user.name} {isMe && <span className="text-xs font-normal text-slate-400">(you)</span>}
        </p>
        <p className="truncate text-xs text-slate-500">{member.user.email}</p>
      </div>
      {showRoleSelect ? (
        <select
          aria-label={`Role for ${member.user.name}`}
          value={member.role}
          onChange={(e) => onRoleChange(member, e.target.value)}
          className="h-8 rounded-lg border border-line-strong bg-white px-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      ) : (
        <RoleBadge role={member.role} />
      )}
      {removable && (
        <Button variant="danger-ghost" size="sm" onClick={() => onRemove(member)}>
          {isMe ? 'Leave' : 'Remove'}
        </Button>
      )}
    </li>
  );
}
