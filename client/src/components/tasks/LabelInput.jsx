import { useState } from 'react';
import Field, { controlClass } from '../common/Field';

// Type a label and press Enter or comma; max 10 labels of up to 20 characters
export default function LabelInput({ value = [], onChange, error }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const label = draft.trim().toLowerCase().slice(0, 20);
    if (label && !value.includes(label) && value.length < 10) onChange([...value, label]);
    setDraft('');
  };

  return (
    <Field label="Labels" htmlFor="labels" error={error} hint={`${value.length}/10 · press Enter to add`}>
      <div className={`${controlClass(error)} flex flex-wrap items-center gap-1.5`}>
        {value.map((l) => (
          <span key={l} className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">
            {l}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== l))} aria-label={`Remove label ${l}`} className="text-indigo-400 hover:text-indigo-700">
              ✕
            </button>
          </span>
        ))}
        <input
          id="labels"
          value={draft}
          maxLength={20}
          onChange={(e) => setDraft(e.target.value.replace(',', ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={add}
          placeholder={value.length ? '' : 'backend, bug…'}
          className="min-w-[6rem] flex-1 border-0 p-0 text-sm focus:outline-none focus:ring-0"
        />
      </div>
    </Field>
  );
}
