import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ImportSettingsCard } from '@/components/ImportSettingsCard';
import { useSimulationStore } from '@/store/simulation';
import type { StoredSimulationSettings } from '@/types';

/** Lists stored settings entries with restore, download, and delete. */
export const ImportSettingsPage = () => {
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState<StoredSimulationSettings | null>(null);

  const storedSettings = useSimulationStore((state) => state.storedSettings);
  const restoreSettings = useSimulationStore((state) => state.restoreSettings);
  const deleteSettings = useSimulationStore((state) => state.deleteSettings);

  const handleRestore = (entry: StoredSimulationSettings) => {
    // Applying to the store is enough for the scene: it reads the settings
    // out of the store every frame. Navigate so the result is visible there.
    restoreSettings(entry);
    void navigate('/simulation');
  };

  const downloadSettings = (entry: StoredSimulationSettings) => {
    const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${entry.name}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        <h1 className="text-xl font-semibold text-stone-900">Stored simulation settings</h1>
        <p className="mt-1 text-sm text-stone-600">
          Restore, download, or delete simulation settings you have stored here.
        </p>

        {storedSettings.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
            <svg
              className="h-10 w-10 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20v-9" />
              <path d="M12 11c0-4 3-6 7-6-1 4-3 6-7 6Z" />
              <path d="M12 14c0-3-2-5-6-5 1 3 3 5 6 5Z" />
              <path d="M6 20h12" />
            </svg>
            <h2 className="mt-4 text-base font-semibold text-stone-900">
              No simulation settings stored yet
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
              Use Import in the top bar to load simulation settings from an external JSON file.
              Alternatively, store new settings from the Simulation page.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {storedSettings.map((entry) => (
              <ImportSettingsCard
                key={entry.name}
                entry={entry}
                onRestore={() => handleRestore(entry)}
                onDownload={() => downloadSettings(entry)}
                onAskDelete={() => setPendingDelete(entry)}
              />
            ))}
          </div>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.name}"?`}
          message="These simulation settings will be permanently deleted. This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => {
            deleteSettings(pendingDelete.name);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
};
