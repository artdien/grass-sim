import { useState } from 'react';
import { CollapsibleSection } from '@/CollapsibleSection';

export const SideBar = () => {
  const [cubeColor, setCubeColor] = useState('#4ade80');
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-y-auto border-r border-stone-200 bg-green-50 transition-[width] duration-200 ${
        isOpen ? 'w-1/5 gap-4 p-4' : 'w-14 items-center p-2'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        className="flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-md border border-stone-200 bg-white text-stone-500 shadow-sm hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-green-50 focus-visible:outline-none"
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

      {isOpen && (
        <>
          <CollapsibleSection title="Color Settings">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
              Cube color
              <span className="flex flex-wrap items-center justify-end gap-2">
                <span className="font-mono text-xs text-stone-500 uppercase">{cubeColor}</span>
                <input
                  type="color"
                  aria-label="Cube color"
                  value={cubeColor}
                  onChange={(event) => setCubeColor(event.target.value)}
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
                <span className="font-mono text-xs text-stone-500">{rotationSpeed.toFixed(1)}</span>
              </label>
              <input
                id="rotation-speed"
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={rotationSpeed}
                onChange={(event) => setRotationSpeed(Number(event.target.value))}
                className="w-full accent-green-600 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
              />
            </div>
          </CollapsibleSection>
        </>
      )}
    </aside>
  );
};
