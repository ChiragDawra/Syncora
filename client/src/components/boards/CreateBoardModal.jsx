import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import BoardForm from './BoardForm';
import { createBoard } from '../../api/boards';
import { fieldErrors } from '../../utils/format';

const EMPTY = { name: '', description: '', color: '#6366f1' };

export default function CreateBoardModal({ teamId, open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErrors({ name: 'Board name is required' });
    setSaving(true);
    try {
      const res = await createBoard(teamId, { ...form, name: form.name.trim(), description: form.description.trim() });
      setForm(EMPTY);
      setErrors({});
      onCreated(res.data.board);
    } catch (err) {
      setErrors(err.code === 'DUPLICATE' ? { name: 'A board with this name already exists in the team' } : { ...fieldErrors(err), form: err.message });
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New board"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-board" loading={saving}>
            Create board
          </Button>
        </>
      }
    >
      <form id="create-board" onSubmit={onSubmit} noValidate>
        {errors.form && <p className="mb-3 text-sm text-red-600">{errors.form}</p>}
        <BoardForm form={form} setForm={setForm} errors={errors} />
      </form>
    </Modal>
  );
}
