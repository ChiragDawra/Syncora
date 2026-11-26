import Input from '../common/Input';
import TextArea from '../common/TextArea';
import { BOARD_COLORS } from '../../utils/constants';

// Controlled fields shared by "new board" and "edit board"
export default function BoardForm({ form, setForm, errors = {} }) {
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <div className="space-y-4">
      <Input label="Board name" name="name" value={form.name} onChange={onChange} error={errors.name} maxLength={80} placeholder="Sprint 1" />
      <TextArea label="Description" name="description" value={form.description} onChange={onChange} error={errors.description} maxLength={500} />
      <fieldset>
        <legend className="mb-1 text-sm font-medium text-slate-700">Color</legend>
        <div className="flex flex-wrap gap-2">
          {BOARD_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              className={`h-7 w-7 rounded-full ring-offset-2 ${form.color === c ? 'ring-2 ring-slate-900' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
              aria-pressed={form.color === c}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
