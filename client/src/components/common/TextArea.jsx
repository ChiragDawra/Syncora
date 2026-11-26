import Field, { controlClass } from './Field';

export default function TextArea({ label, id, name, error, hint, className = '', rows = 3, ...props }) {
  const areaId = id || name;
  return (
    <Field label={label} htmlFor={areaId} error={error} hint={hint} className={className}>
      <textarea id={areaId} name={name} rows={rows} aria-invalid={Boolean(error)} className={controlClass(error)} {...props} />
    </Field>
  );
}
