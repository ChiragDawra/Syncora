import Badge from '../common/Badge';
import Icon from '../common/Icon';
import { PRIORITY_LABELS } from '../../utils/constants';

// icon + text + color, so priority reads without relying on color alone
const STYLE = {
  low: { tone: 'slate', icon: 'arrowDown' },
  medium: { tone: 'sky', icon: 'minus' },
  high: { tone: 'amber', icon: 'arrowUp' },
  urgent: { tone: 'red', icon: 'flame' },
};

export default function PriorityBadge({ priority }) {
  const s = STYLE[priority] || STYLE.medium;
  return (
    <Badge tone={s.tone}>
      <Icon name={s.icon} className="h-3 w-3" strokeWidth={2.4} />
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
