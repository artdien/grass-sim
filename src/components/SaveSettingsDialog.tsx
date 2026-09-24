import { useEffect, useState, type SubmitEvent } from 'react';
import type { Result } from '@/types';

interface Props {
  onSubmit: (name: string) => Promise<Result>;
  onClose: () => void;
}

export const SaveSettingsDialog = ({ onSubmit, onClose }: Props) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, submitting]);

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    const result = await onSubmit(name);
    setSubmitting(false);

    if (result.ok) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-settings-dialog-title"
        noValidate
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-5 shadow-lg"
      >
        <h2 id="save-settings-dialog-title" className="text-base font-semibold text-stone-900">
          Store simulation settings
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Give these settings a name. The current state of the scene is stored together with them.
        </p>

        <label
          htmlFor="save-settings-name"
          className="mt-4 block text-sm font-medium text-stone-900"
        >
          Name
        </label>
        <input
          id="save-settings-name"
          type="text"
          autoFocus
          value={name}
          disabled={submitting}
          aria-invalid={error !== null}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          className="mt-1.5 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
          placeholder="e.g. Meadow"
        />
        {error && (
          <p id="save-settings-dialog-error" role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-600 shadow-sm transition-colors hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};
