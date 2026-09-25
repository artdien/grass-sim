import { useEffect } from 'react';

type ConfirmTone = 'danger' | 'primary';

interface Props {
  /** Dialog heading. */
  title: string;

  /** Body copy below the heading. */
  message: string;

  /** Label for the always-shown confirm button. */
  confirmLabel: string;

  /** Omit to hide the cancel button and show only the confirm action. */
  cancelLabel?: string;

  /** `danger` (red) for destructive confirmations, `primary` (green) otherwise. */
  confirmTone?: ConfirmTone;

  /** Invoked when the user confirms. */
  onConfirm: () => void;

  /** Invoked when the user dismisses (cancel button, backdrop, or Escape). */
  onCancel: () => void;
}

const confirmToneClasses: Record<ConfirmTone, string> = {
  danger:
    'rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none',
  primary:
    'rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none',
};

/** Modal confirmation dialog: heading, message, and a confirm (and optional cancel) action. */
export const ConfirmDialog = ({
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmTone = 'danger',
  onConfirm,
  onCancel,
}: Props) => {
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-5 shadow-lg"
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-stone-900">
          {title}
        </h2>
        <p id="confirm-dialog-message" className="mt-2 text-sm leading-relaxed text-stone-600">
          {message}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          {cancelLabel !== undefined && (
            <button
              type="button"
              autoFocus
              onClick={onCancel}
              className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-600 shadow-sm transition-colors hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            autoFocus={cancelLabel === undefined}
            onClick={onConfirm}
            className={confirmToneClasses[confirmTone]}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
