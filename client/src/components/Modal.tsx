import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ open, title, onClose, children, wide }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal ${wide ? 'wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'حذف',
  onConfirm,
  onClose,
  loading,
}: ConfirmProps) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{message}</p>
      <div className="modal-actions">
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'جاري...' : confirmLabel}
        </button>
        <button className="btn btn-outline" onClick={onClose} disabled={loading}>
          إلغاء
        </button>
      </div>
    </Modal>
  );
}
