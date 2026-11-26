import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import BoardForm from './BoardForm';
import { updateBoard } from '../../api/boards';
import { fieldErrors } from '../../utils/format';

export default function EditBoardModal({ board, open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: board.name, description: board.description || '', color: board.color });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ name: board.name, description: board.description || '', color: board.color });
  }, [open, board]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErrors({ name: 'Board name is required' });
    setSaving(true);
    try {
      const res = await updateBoard(board._id, { ...form, name: form.name.trim(), description: form.description.trim() });
      setErrors({});
      onSaved(res.data.board);
    } catch (err) {
      setErrors(err.code === 'DUPLICATE' ? { name: 'A board with this name already exists' } : { ...fieldErrors(err), form: err.message });
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit board"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-board" loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <form id="edit-board" onSubmit={onSubmit} noValidate>
        {errors.form && <p className="mb-3 text-sm text-red-600">{errors.form}</p>}
        <BoardForm form={form} setForm={setForm} errors={errors} />
      </form>
    </Modal>
  );
}
