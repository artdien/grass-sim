import type { ChangeEvent } from 'react';
import { FieldHelp } from '@/components/fields/FieldHelp';

interface Props {
  /** Unique id of the input, used to bind the label. */
  id: string;

  /** Text shown to the left of the picker. */
  label: string;

  /** Optional explanation behind the help icon rendered next to the picker. */
  help?: string;

  /** Current color as a hex string (#rrggbb). */
  value: string;

  /** Fires with the new color; a color input value is always a valid hex string. */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** Labeled native color picker, matching the label rows of the settings sidebar. */
export const ColorField = ({ id, label, help, value, onChange }: Props) => (
  <div className="flex items-center justify-between gap-2 text-sm text-stone-600">
    <label htmlFor={id}>{label}</label>
    <span className="flex items-center gap-1.5">
      <input
        id={id}
        type="color"
        value={value}
        onChange={onChange}
        className="h-7 w-10 cursor-pointer rounded-md border border-stone-200 bg-white p-0.5 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
      />
      {help ? <FieldHelp help={help} label={label} /> : null}
    </span>
  </div>
);
