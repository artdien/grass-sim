import { useState, type ChangeEvent } from 'react';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { SaveSettingsDialog } from '@/components/SaveSettingsDialog';
import type { Result, TerrainSettings } from '@/types';
import { captureSceneScreenshot } from '@/scene/screenshot';
import { useSimulationStore } from '@/store/simulation';

const SCREENSHOT_WIDTH = 400;

/** Parses a terrain field input; null when it is not an integer ≥ 1. */
const parseTerrainValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
};

/** Collapsible settings panel: live scene settings and saving them under a name. */
export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [pendingSave, setPendingSave] = useState(false);

  const activeSettings = useSimulationStore((state) => state.activeSettings);
  const updateActiveSettings = useSimulationStore((state) => state.updateActiveSettings);
  const saveSettings = useSimulationStore((state) => state.saveSettings);

  const handleSave = async (name: string): Promise<Result> => {
    const screenshot = await captureSceneScreenshot(SCREENSHOT_WIDTH);

    if (!screenshot.ok) {
      console.warn('Scene screenshot capture failed with error type:', screenshot.error);

      return {
        ok: false,
        error: 'Could not capture a snapshot of the current render. Please try again.',
      };
    }

    const result = saveSettings(name, screenshot.data);

    if (result.ok) {
      return { ok: true, data: undefined };
    }

    switch (result.error) {
      case 'EMPTY_NAME':
        return { ok: false, error: 'Name is empty.' };

      case 'EMPTY_IMAGE':
        return {
          ok: false,
          error: 'Could not capture a screenshot of the current render. Please try again.',
        };

      case 'DUPLICATE_ENTRY':
        return { ok: false, error: 'Settings with this name are already stored.' };

      default:
        return { ok: false, error: 'Please enter a name for the settings.' };
    }
  };

  // Invalid input is not committed, so the field snaps back to its last valid value.
  const handleTerrainChange = (
    field: keyof TerrainSettings,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const parsed = parseTerrainValue(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      terrain: { ...activeSettings.terrain, [field]: parsed },
    });
  };

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-y-auto border-r border-stone-200 bg-green-50 transition-[width] duration-200 ${
        isOpen ? 'w-1/5 gap-4 p-4' : 'w-14 items-center p-2'
      }`}
    >
      <div className={`flex items-center ${isOpen ? 'justify-between gap-2' : 'justify-center'}`}>
        {isOpen && <span className="text-sm font-semibold text-stone-900">Settings</span>}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-500 shadow-sm hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-green-50 focus-visible:outline-none"
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-0' : 'rotate-180'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <>
          <CollapsibleSection title="Terrain">
            <div className="space-y-3">
              <label
                htmlFor="terrain-size"
                className="flex items-center justify-between gap-2 text-sm text-stone-600"
              >
                Size
                <input
                  id="terrain-size"
                  type="number"
                  min={1}
                  step={1}
                  value={activeSettings.terrain.size}
                  onChange={(event) => handleTerrainChange('size', event)}
                  className="w-24 rounded-md border border-stone-200 bg-white px-2 py-1 text-right font-mono text-xs text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
                />
              </label>

              <label
                htmlFor="terrain-segments"
                className="flex items-center justify-between gap-2 text-sm text-stone-600"
              >
                Segments
                <input
                  id="terrain-segments"
                  type="number"
                  min={1}
                  step={1}
                  value={activeSettings.terrain.segments}
                  onChange={(event) => handleTerrainChange('segments', event)}
                  className="w-24 rounded-md border border-stone-200 bg-white px-2 py-1 text-right font-mono text-xs text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
                />
              </label>
            </div>
          </CollapsibleSection>

          <button
            type="button"
            onClick={() => setPendingSave(true)}
            className="mt-auto w-full rounded-md bg-green-600 px-3 py-2 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-green-50 focus-visible:outline-none"
          >
            Save
          </button>
        </>
      )}

      {pendingSave && (
        <SaveSettingsDialog onSubmit={handleSave} onClose={() => setPendingSave(false)} />
      )}
    </aside>
  );
};
