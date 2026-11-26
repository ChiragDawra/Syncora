import Select from '../common/Select';

// Only team members can be assigned (the server checks this too)
export default function AssigneeSelect({ members, value, onChange, error, label = 'Assignee', name = 'assignee' }) {
  const options = members.map((m) => ({ value: m.user._id, label: m.user.name }));
  return <Select label={label} name={name} value={value || ''} onChange={(e) => onChange(e.target.value || null)} options={options} placeholder="Unassigned" error={error} />;
}
