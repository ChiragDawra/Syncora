import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import useUpload from '../hooks/useUpload';
import { changePassword, updateMe, uploadAvatar } from '../api/auth';
import Avatar from '../components/common/Avatar';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';
import { fieldErrors } from '../utils/format';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export default function ProfilePage() {
  const { user, updateUser, saveSession } = useAuth();
  const fileInput = useRef(null);
  const { upload, progress, uploading } = useUpload();

  const [name, setName] = useState(user.name);
  const [nameError, setNameError] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  const saveName = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setNameError('Name must be 2 to 60 characters');
      return;
    }
    setSavingName(true);
    try {
      const res = await updateMe({ name: name.trim() });
      updateUser(res.data.user);
      setNameError('');
      toast.success('Name updated');
    } catch (err) {
      setNameError(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const onAvatar = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Pick a PNG, JPG or WEBP image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be 2 MB or less');
      return;
    }
    try {
      const res = await upload((onProgress) => uploadAvatar(file, onProgress));
      updateUser(res.data.user);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pw.currentPassword) errs.currentPassword = 'Enter your current password';
    if (!PASSWORD_RULE.test(pw.newPassword)) errs.newPassword = '8 to 64 characters, with a letter and a number';
    if (pw.confirm !== pw.newPassword) errs.confirm = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setSavingPw(true);
    try {
      const res = await changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      saveSession(res.data.user, res.data.token); // server returns a fresh token
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) {
      setPwErrors(err.status === 401 ? { currentPassword: 'Current password is incorrect' } : fieldErrors(err));
    } finally {
      setSavingPw(false);
    }
  };

  const onPwChange = (e) => setPw((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Profile</h1>

      <Card title="Your details">
        <div className="mb-5 flex items-center gap-4">
          <Avatar user={user} size="lg" />
          <div className="space-y-2">
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onAvatar} aria-label="Choose avatar" />
            <Button variant="secondary" size="sm" onClick={() => fileInput.current.click()} loading={uploading}>
              Change avatar
            </Button>
            <p className="text-xs text-slate-500">PNG, JPG or WEBP, up to 2 MB</p>
            {uploading && <ProgressBar value={progress} />}
          </div>
        </div>
        <form onSubmit={saveName} noValidate className="space-y-4">
          <Input label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} error={nameError} maxLength={60} />
          <Input label="Email" name="email" value={user.email} disabled hint="Email can't be changed" />
          <div className="flex justify-end">
            <Button type="submit" loading={savingName} disabled={name.trim() === user.name}>
              Save
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Change password">
        <form onSubmit={savePassword} noValidate className="space-y-4">
          <Input
            label="Current password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={onPwChange}
            error={pwErrors.currentPassword}
          />
          <Input label="New password" name="newPassword" type="password" autoComplete="new-password" value={pw.newPassword} onChange={onPwChange} error={pwErrors.newPassword} />
          <Input label="Confirm new password" name="confirm" type="password" autoComplete="new-password" value={pw.confirm} onChange={onPwChange} error={pwErrors.confirm} />
          <div className="flex justify-end">
            <Button type="submit" loading={savingPw}>
              Change password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
