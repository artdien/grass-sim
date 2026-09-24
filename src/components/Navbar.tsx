import { useRef, useState, type ChangeEvent } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { parseSimulationSettings } from '@/store/parsing';
import { useSimulationStore } from '@/store/simulation';
import type { StoredSimulationSettings } from '@/types';

const linkClassName = (isActive: boolean) =>
  [
    'rounded-md px-0.5 py-0.5 text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    isActive ? 'text-green-700' : 'text-stone-500 hover:text-stone-900',
  ].join(' ');

export const Navbar = () => {
  const { pathname } = useLocation();
  // Normalize trailing slashes so both "/page" and "/page/" count as the same page,
  // while unrelated paths (e.g. "/page/doesnotexist") do not highlight any link.
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
  const isActive = (to: string) => normalizedPathname === to;
  const showImport = isActive('/import-settings');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storedSettings = useSimulationStore((state) => state.storedSettings);
  const importSettings = useSimulationStore((state) => state.importSettings);

  const [pendingImport, setPendingImport] = useState<StoredSimulationSettings | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so re-selecting the same file fires another change event.
    event.target.value = '';
    if (!file) {
      return;
    }

    const result = parseSimulationSettings(await file.text());

    if (!result.ok) {
      setImportError(result.error);
      return;
    }

    const entry = result.data;
    if (storedSettings.some((item) => item.name === entry.name)) {
      setPendingImport(entry);
    } else {
      importSettings(entry);
    }
  };

  return (
    <nav
      aria-label="Main"
      className="flex items-center gap-8 border-b border-stone-200 bg-white px-6 py-3"
    >
      <div className="flex items-center gap-2">
        <img src="/icon.svg" alt="" className="h-9 w-9 shrink-0" aria-hidden="true" />
        <span className="text-base leading-tight font-semibold text-stone-900" aria-hidden="true">
          Grass
          <br />
          Simulation
        </span>
      </div>
      <div className="flex items-center gap-6">
        <NavLink to="/simulation" className={linkClassName(isActive('/simulation'))}>
          Simulation
        </NavLink>
        <NavLink to="/import-settings" className={linkClassName(isActive('/import-settings'))}>
          Import Settings
        </NavLink>
      </div>
      {showImport && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              void handleFileChange(event);
            }}
          />
          <button
            type="button"
            title="Imports simulation settings from an external JSON file"
            onClick={handleImportClick}
            className="ml-auto rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
          >
            Import
          </button>
        </>
      )}

      {pendingImport && (
        <ConfirmDialog
          title={`Overwrite "${pendingImport.name}"?`}
          message="A stored entry with this name already exists. Importing will replace its saved values."
          confirmLabel="Overwrite"
          cancelLabel="Cancel"
          onConfirm={() => {
            importSettings(pendingImport);
            setPendingImport(null);
          }}
          onCancel={() => setPendingImport(null)}
        />
      )}

      {importError && (
        <ConfirmDialog
          title="Import failed"
          message={importError}
          confirmLabel="Close"
          confirmTone="primary"
          onConfirm={() => setImportError(null)}
          onCancel={() => setImportError(null)}
        />
      )}
    </nav>
  );
};
