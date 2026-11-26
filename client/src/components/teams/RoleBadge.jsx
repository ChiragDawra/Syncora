import Badge from '../common/Badge';

const TONE = { owner: 'indigo', admin: 'sky', member: 'slate' };

export default function RoleBadge({ role }) {
  if (!role) return null;
  return <Badge tone={TONE[role]} className="h-[18px] px-1.5 text-[10px] font-semibold uppercase tracking-wide">{role}</Badge>;
}
