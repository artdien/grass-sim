import type { ChangeEvent } from 'react';

interface Props {
  /** Unique id of the input, used to bind the label. */
  id: string;

  /** Text shown to the left of the picker. */
  label: string;

  /** Current color as a hex string (#rrggbb). */
  value: string;

  /** Fires with the new color; a color input value is always a valid hex string. */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** Labeled native color picker, matching the label rows of the settings sidebar. */
export const ColorField = ({ id, label, value, onChange }: Props) => (
  <label htmlFor={id} className="flex items-center justify-between gap-2 text-sm text-stone-600">
    {label}
    <input
      id={id}
      type="color"
      value={value}
      onChange={onChange}
      className="h-7 w-10 cursor-pointer rounded-md border border-stone-200 bg-white p-0.5 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
    />
  </label>
);
