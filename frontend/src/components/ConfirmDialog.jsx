import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmDialog({
  open,
  title = 'Confirmação',
  message,
  cancelText = 'Cancelar',
  confirmText = 'Confirmar',
  onClose,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const node = (
    <div className="fixed inset-0 z-50">
      {/* overlay com mesma opacidade do modal dos equipamentos */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* caixa do modal — cantos mais arredondados + sombra forte */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                   w-[min(560px,92vw)] bg-white rounded-2xl shadow-2xl ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="p-6">
          <h2 id="confirm-title" className="text-lg font-semibold">
            {title}
          </h2>

          {/* ✅ preserva quebras de linha (\n) e evita estourar layout */}
          <p className="mt-2 text-sm text-slate-600 whitespace-pre-line break-words max-h-72 overflow-auto pr-1">
            {message}
          </p>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700
                         bg-white shadow-sm hover:bg-slate-50 transition-colors"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-red-600 text-white
                         hover:bg-red-700 transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}