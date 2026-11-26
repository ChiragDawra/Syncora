import { STATUS_LABELS } from './constants';

// Turn an activity entry into a short sentence for the feed
export function describeActivity(a) {
  const m = a.meta || {};
  const title = m.title ? `"${m.title}"` : 'a task';
  switch (a.action) {
    case 'team.created':
      return `created the team ${m.name || ''}`;
    case 'team.updated':
      return 'updated the team details';
    case 'member.added':
      return `added ${m.name} as ${m.role}`;
    case 'member.removed':
      return m.left ? 'left the team' : `removed ${m.name}`;
    case 'member.role_changed':
      return `changed ${m.name}'s role from ${m.from} to ${m.to}`;
    case 'board.created':
      return `created the board "${m.name}"`;
    case 'board.updated':
      if (m.archived === true) return `archived the board "${m.name}"`;
      if (m.archived === false) return `restored the board "${m.name}"`;
      return m.renamedFrom ? `renamed the board "${m.renamedFrom}" to "${m.name}"` : `updated the board "${m.name}"`;
    case 'board.deleted':
      return `deleted the board "${m.name}"`;
    case 'task.created':
      return `created ${title}`;
    case 'task.updated':
      return `updated ${title}${m.fields?.length ? ` (${m.fields.join(', ')})` : ''}`;
    case 'task.moved':
      return `moved ${title} from ${STATUS_LABELS[m.from] || m.from} to ${STATUS_LABELS[m.to] || m.to}`;
    case 'task.deleted':
      return `deleted ${title}`;
    case 'comment.added':
      return `commented on ${title}${m.excerpt ? `: "${m.excerpt}"` : ''}`;
    case 'attachment.added':
      return `attached ${(m.files || []).join(', ')} to ${title}`;
    case 'attachment.removed':
      return `removed ${m.file} from ${title}`;
    default:
      return a.action;
  }
}

// icon names for components/common/Icon
export const ACTIVITY_ICONS = {
  team: 'users',
  member: 'user',
  board: 'kanban',
  task: 'checkCircle',
  comment: 'message',
  attachment: 'paperclip',
};
