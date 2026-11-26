import Field, { controlClass } from './Field';

export default function Input({ label, id, name, error, hint, className = '', ...props }) {
  const inputId = id || name;
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} className={className}>
      <input id={inputId} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} className={controlClass(error)} {...props} />
    </Field>
  );
}
