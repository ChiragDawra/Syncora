import Field, { controlClass } from './Field';

// options: [{ value, label }]
export default function Select({ label, id, name, error, hint, options = [], className = '', placeholder, ...props }) {
  const selectId = id || name;
  return (
    <Field label={label} htmlFor={selectId} error={error} hint={hint} className={className}>
      <select id={selectId} name={name} aria-invalid={Boolean(error)} className={controlClass(error)} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
