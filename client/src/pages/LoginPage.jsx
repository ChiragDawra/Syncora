import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import AuthShell from '../components/auth/AuthShell';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { fieldErrors } from '../utils/format';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  // controlled form
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validateForm = () => {
    const errs = {};
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(location.state?.from?.pathname || '/teams', { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(err.status === 401 ? 'Email or password is incorrect' : err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Log in to Syncora"
      subtitle="Every task with an owner, a status and a deadline."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {params.get('expired') && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Session expired, please log in again.</p>}
      {formError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </p>
      )}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
        <Input label="Password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={onChange} error={errors.password} />
        <Button type="submit" loading={submitting} className="w-full">
          Log in
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-500">Demo: owner@syncora.dev / Password123</p>
    </AuthShell>
  );
}
