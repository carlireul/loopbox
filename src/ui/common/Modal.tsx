import { useEffect, type ReactNode } from 'react';

/**
 * A scrollable centred modal. Replaces the react-bootstrap `Modal` the legacy
 * tutorials used. Children mount only while open, so tutorials can run their
 * canvas/audio setup in an effect keyed on the open state.
 */
export function Modal({
  open,
  onClose,
  title,
  actions,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Extra buttons shown in the header, before the close button. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-10 mt-[5vh] flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            {actions}
            <button className="btn-muted" onClick={onClose} aria-label="Close">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/** The magnifying-glass button every tutorial opens from. */
export function TutorialButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button className="btn-muted" onClick={onClick} title={label}>
      <i className="fa-solid fa-magnifying-glass" />
    </button>
  );
}
