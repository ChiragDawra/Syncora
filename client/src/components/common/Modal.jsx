import { useEffect, useRef } from 'react';
import Icon from './Icon';

export default function Modal({ open, title, onClose, children, footer, size = 'md' }) {
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    panel.current?.querySelector('input, select, textarea, button:not([aria-label="Close"])')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/25 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`flex max-h-[92vh] w-full ${width} flex-col rounded-t-2xl border border-line-strong bg-white shadow-dialog sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 id="modal-title" className="text-base font-semibold tracking-tight text-ink">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-sunken hover:text-slate-700" aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3 pb-safe">{footer}</div>}
      </div>
    </div>
  );
}
