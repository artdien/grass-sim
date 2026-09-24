import { useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ImportSettingsCard } from '@/components/ImportSettingsCard';
import type { StoredSimulationSettings } from '@/types';

// Hard-coded placeholder data with black images and dummy values. Will be replaced by real stored state in a later task.
const STORED_SETTINGS: StoredSimulationSettings[] = [
  {
    name: 'Meadow default',
    image:
      'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAxUlEQVR4Ae3BAQEAAACCIP1/ugsOCOQyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8sGqJ8AZeonWEsAAAAASUVORK5CYII=',
    cubeColor: '#4ade80',
    rotationSpeed: 1.0,
  },
  {
    name: 'Highlands',
    image:
      'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAxUlEQVR4Ae3BAQEAAACCIP1/ugsOCOQyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8sGqJ8AZeonWEsAAAAASUVORK5CYII=',
    cubeColor: '#22c55e',
    rotationSpeed: 2.5,
  },
  {
    name: 'Sunset grass',
    image:
      'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAxUlEQVR4Ae3BAQEAAACCIP1/ugsOCOQyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8sGqJ8AZeonWEsAAAAASUVORK5CYII=',
    cubeColor: '#a3e635',
    rotationSpeed: 0.5,
  },
  {
    name: 'Alpine field',
    image:
      'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAxUlEQVR4Ae3BAQEAAACCIP1/ugsOCOQyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8vkMrlMLpPL5DK5TC6Ty+QyuUwuk8sGqJ8AZeonWEsAAAAASUVORK5CYII=',
    cubeColor: '#86efac',
    rotationSpeed: 4.0,
  },
];

export const ImportSettingsPage = () => {
  const [pendingDelete, setPendingDelete] = useState<StoredSimulationSettings | null>(null);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        <h1 className="text-xl font-semibold text-stone-900">Stored simulation settings</h1>
        <p className="mt-1 text-sm text-stone-600">
          Restore, download, or delete simulation settings you have stored here.
        </p>

        {STORED_SETTINGS.length === 0 ? (
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
            {STORED_SETTINGS.map((entry) => (
              <ImportSettingsCard
                key={entry.name}
                entry={entry}
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
          onConfirm={() => setPendingDelete(null)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
};
