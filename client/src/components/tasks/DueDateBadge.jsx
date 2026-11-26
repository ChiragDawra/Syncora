import { format } from 'date-fns';
import Badge from '../common/Badge';
import Icon from '../common/Icon';
import { dueLabel } from '../../utils/format';

export default function DueDateBadge({ task }) {
  if (task.status === 'done') {
    if (!task.completedAt && !task.dueDate) return null;
    return (
      <Badge tone="green">
        <Icon name="checkCircle" className="h-3 w-3" />
        {task.completedAt ? `Completed ${format(new Date(task.completedAt), 'd MMM')}` : `Due ${format(new Date(task.dueDate), 'd MMM')}`}
      </Badge>
    );
  }
  if (!task.dueDate) return null;
  return (
    <Badge tone={task.isOverdue ? 'red' : 'slate'}>
      <Icon name={task.isOverdue ? 'alarm' : 'clock'} className="h-3 w-3" />
      {dueLabel(task.dueDate)}
    </Badge>
  );
}
