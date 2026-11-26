import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

// Confirm before deleting. confirmText (e.g. the team name) must be typed when given.
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', confirmText, onConfirm, onClose }) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      setTyped('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={busy ? undefined : onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={busy} disabled={confirmText ? typed !== confirmText : false}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
      {confirmText && (
        <Input
          className="mt-3"
          name="confirm"
          label={`Type "${confirmText}" to confirm`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
        />
      )}
    </Modal>
  );
}
