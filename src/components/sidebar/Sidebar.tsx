import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { SaveSettingsDialog } from '@/components/dialogs/SaveSettingsDialog';
import { WindSettingsSection } from '@/components/sidebar/WindSettingsSection';
import { GrassSettingsSection } from '@/components/sidebar/GrassSettingsSection';
import { TerrainSettingsSection } from '@/components/sidebar/TerrainSettingsSection';
import { LightingSettingsSection } from '@/components/sidebar/LightingSettingsSection';
import type { Result } from '@/types';
import { captureSceneScreenshot } from '@/scene/screenshot';
import { useSimulationStore } from '@/store/simulation';

const SCREENSHOT_WIDTH = 400;
const MIN_SIDEBAR_WIDTH = 224;
const MAX_SIDEBAR_FRACTION = 0.5;

/** Collapsible settings panel: live scene settings and saving them under a name; resizable by dragging its right edge. */
export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [pendingSave, setPendingSave] = useState(false);
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);

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

  const clampSidebarWidth = (width: number) => {
    const parentWidth = asideRef.current?.parentElement?.clientWidth;
    const maxWidth = Math.max(
      MIN_SIDEBAR_WIDTH,
      parentWidth ? Math.round(parentWidth * MAX_SIDEBAR_FRACTION) : width,
    );

    return Math.round(Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), maxWidth));
  };

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const aside = asideRef.current;
    if (!aside) {
      return;
    }

    event.preventDefault();

    const startX = event.clientX;
    const startWidth = aside.getBoundingClientRect().width;

    const handleMove = (moveEvent: PointerEvent) => {
      setCustomWidth(clampSidebarWidth(startWidth + (moveEvent.clientX - startX)));
    };

    const finishResize = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', finishResize);
      window.removeEventListener('pointercancel', finishResize);

      setIsDragging(false);
    };

    setIsDragging(true);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', finishResize);
    window.addEventListener('pointercancel', finishResize);
  };

  return (
    <aside
      ref={asideRef}
      style={isOpen && customWidth !== null ? { width: customWidth } : undefined}
      className={`relative hidden h-full shrink-0 border-r border-stone-200 bg-green-50 pointer-fine:block ${
        isDragging ? '' : 'transition-[width] duration-200'
      } ${isOpen ? (customWidth === null ? 'w-1/5' : '') : 'w-14'}`}
    >
      <div
        className={`flex w-full flex-col ${
          isOpen ? 'h-full min-h-0 gap-4 overflow-y-auto p-4' : 'h-full items-center p-2'
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
            <WindSettingsSection />

            <GrassSettingsSection />

            <TerrainSettingsSection />

            <LightingSettingsSection />

            <button
              type="button"
              onClick={() => setPendingSave(true)}
              className="mt-auto w-full rounded-md bg-green-600 px-3 py-2 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-green-50 focus-visible:outline-none"
            >
              Save
            </button>
          </>
        )}
      </div>

      {isOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onPointerDown={startResize}
          className={`absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize select-none ${
            isDragging ? 'bg-green-600' : 'bg-transparent hover:bg-green-600/40'
          }`}
        />
      )}

      {pendingSave && (
        <SaveSettingsDialog onSubmit={handleSave} onClose={() => setPendingSave(false)} />
      )}
    </aside>
  );
};
