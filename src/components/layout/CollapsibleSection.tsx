import { useState } from 'react';
import type { ReactNode } from 'react';

interface Props {
  /** Section heading in the header row. */
  title: string;

  /** Section content, shown while the section is open. */
  children: ReactNode;
}

/** Card with a toggleable header and content, open by default. */
export const CollapsibleSection = ({ title, children }: Props) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
      >
        <span className="text-sm font-semibold text-stone-900">{title}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-stone-500 transition-transform ${isOpen ? '' : '-rotate-90'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isOpen && <div className="border-t border-stone-200 px-4 pt-3 pb-4">{children}</div>}
    </section>
  );
};
