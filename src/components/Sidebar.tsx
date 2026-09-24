import { useState } from 'react';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { SaveSettingsDialog } from '@/components/SaveSettingsDialog';
import type { Result } from '@/types';
import { captureSceneScreenshot } from '@/scene/screenshot';
import { useSimulationStore } from '@/store/simulation';

const SCREENSHOT_WIDTH = 400;

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
          <CollapsibleSection title="Color Settings">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
              Cube color
              <span className="flex flex-wrap items-center justify-end gap-2">
                <span className="font-mono text-xs text-stone-500 uppercase">
                  {activeSettings.cubeColor}
                </span>
                <input
                  type="color"
                  aria-label="Cube color"
                  value={activeSettings.cubeColor}
                  onChange={(event) =>
                    updateActiveSettings({ ...activeSettings, cubeColor: event.target.value })
                  }
                  className="h-8 w-12 cursor-pointer rounded-md border border-stone-200 bg-white p-0.5 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
                />
              </span>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Motion Settings">
            <div className="space-y-2">
              <label
                htmlFor="rotation-speed"
                className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm text-stone-600"
              >
                Rotation speed
                <span className="font-mono text-xs text-stone-500">
                  {activeSettings.rotationSpeed.toFixed(1)}
                </span>
              </label>
              <input
                id="rotation-speed"
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={activeSettings.rotationSpeed}
                onChange={(event) =>
                  updateActiveSettings({
                    ...activeSettings,
                    rotationSpeed: Number(event.target.value),
                  })
                }
                className="w-full accent-green-600 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
              />
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
