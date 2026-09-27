import type { StoredSimulationSettings } from '@/types';

interface Props {
  /** The stored entry this card renders. */
  entry: StoredSimulationSettings;

  /** Applies the entry's settings as the active settings. */
  onRestore: () => void;

  /** Downloads the entry's JSON. */
  onDownload: () => void;

  /** Requests deletion — expected to open a confirmation, not delete directly. */
  onAskDelete: () => void;
}

/** Card for one stored settings entry: its snapshot plus restore, download, and delete. */
export const ImportSettingsCard = ({ entry, onRestore, onDownload, onAskDelete }: Props) => {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-2 px-4 py-3">
        <h2 className="truncate text-sm font-semibold text-stone-900">{entry.name}</h2>
        <button
          type="button"
          title="Delete these simulation settings"
          aria-label={`Delete ${entry.name}`}
          onClick={onAskDelete}
          className="hidden rounded-md bg-red-50 p-1 text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none pointer-fine:inline-flex"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </header>

      <img
        src={`data:image/png;base64,${entry.image}`}
        alt={`Render screenshot of ${entry.name}`}
        className="aspect-video w-full bg-stone-100 object-cover"
      />

      <footer className="mt-auto flex gap-2 border-t border-stone-200 px-4 py-3">
        <button
          type="button"
          title="Restores these simulation settings and applies them to the current simulation"
          onClick={onRestore}
          className="flex-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
        >
          Restore
        </button>
        <button
          type="button"
          title="Downloads these simulation settings as a JSON file"
          aria-label={`Download ${entry.name}`}
          onClick={onDownload}
          className="hidden flex-1 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-600 shadow-sm transition-colors hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none pointer-fine:flex"
        >
          Download
        </button>
      </footer>
    </article>
  );
};
