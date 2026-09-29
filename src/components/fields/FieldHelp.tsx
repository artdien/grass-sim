import { useEffect, useRef, useState } from 'react';

interface Props {
  /** Explanation of the settings field this icon sits next to. */
  help: string;

  /** Label of the settings field, used for the accessible name. */
  label: string;
}

/**
 * Small "?" icon beside a settings field; clicking it toggles a popover with the field's explanation.
 * Any pointerdown outside the popover closes it.
 */
export const FieldHelp = ({ help, label }: Props) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    // Exclude the icon itself: its own pointerdown should fall through to the
    // onClick toggle rather than being swallowed by the close handler.
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  return (
    <span ref={containerRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`What ${label} does`}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center justify-center text-stone-500 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute right-0 bottom-full z-10 mb-1.5 w-48 rounded-md border border-stone-200 bg-white p-2 text-left text-xs leading-relaxed text-stone-600 shadow-sm"
        >
          {help}
        </span>
      )}
    </span>
  );
};
