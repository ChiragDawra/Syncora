import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import AuthShell from '../components/auth/AuthShell';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { fieldErrors } from '../utils/format';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;

function validate({ name, email, password, confirm }) {
  const errs = {};
  if (name.trim().length < 2 || name.trim().length > 60) errs.name = 'Name must be 2 to 60 characters';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Enter a valid email';
  if (!PASSWORD_RULE.test(password)) errs.password = '8 to 64 characters, with at least one letter and one number';
  if (confirm !== password) errs.confirm = 'Passwords do not match';
  return errs;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onBlur = (e) => {
    const errs = validate(form);
    setErrors((prev) => ({ ...prev, [e.target.name]: errs[e.target.name] }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast.success('Account created');
      navigate('/teams', { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err)); // server details[] mapped onto the fields
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up a team and add your first task in under two minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {formError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </p>
      )}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input label="Name" name="name" autoComplete="name" value={form.name} onChange={onChange} onBlur={onBlur} error={errors.name} />
        <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} onBlur={onBlur} error={errors.email} />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={onChange}
          onBlur={onBlur}
          error={errors.password}
          hint="At least 8 characters with a letter and a number"
        />
        <Input label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={onChange} onBlur={onBlur} error={errors.confirm} />
        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
