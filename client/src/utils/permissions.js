// Role -> allowed actions. Mirrors the server matrix in docs/SYSTEM_DESIGN.md §5.2.
// Hiding a button is UX only; the server enforces every rule again.
const ALL = ['owner', 'admin', 'member'];
const ADMINS = ['owner', 'admin'];

export const PERMISSIONS = {
  'team:update': ADMINS,
  'team:delete': ['owner'],
  'team:settings': ADMINS,
  'member:add': ADMINS,
  'member:addAdmin': ['owner'],
  'member:changeRole': ['owner'],
  'team:leave': ['admin', 'member'],
  'board:create': ADMINS,
  'board:update': ADMINS,
  'board:delete': ADMINS,
  'task:create': ALL,
  'task:update': ALL,
  'task:move': ALL,
  'task:deleteAny': ADMINS,
  'comment:create': ALL,
  'comment:deleteAny': ADMINS,
  'attachment:upload': ALL,
  'attachment:deleteAny': ADMINS,
};

export const can = (role, action) => Boolean(role && PERMISSIONS[action]?.includes(role));

const sameId = (a, b) => String(a?._id || a) === String(b?._id || b);

// owner removes anyone but self; admin removes plain members; anyone (but the owner) may leave
export function canRemoveMember(myRole, myId, member) {
  if (member.role === 'owner') return false;
  if (sameId(member.user, myId)) return true;
  if (myRole === 'owner') return true;
  return myRole === 'admin' && member.role === 'member';
}

export const canDeleteTask = (role, userId, task) => can(role, 'task:deleteAny') || sameId(task.createdBy, userId);
export const canDeleteComment = (role, userId, c) => can(role, 'comment:deleteAny') || sameId(c.author, userId);
export const canDeleteAttachment = (role, userId, a) => can(role, 'attachment:deleteAny') || sameId(a.uploadedBy, userId);
