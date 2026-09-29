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

/**
 * Labeled native color picker, one row at the settings sidebar's default width with the
 * picker and help icon right-aligned;
 * below 250px of available width the picker collapses to the row below, right-aligned,
 * while the help icon stays on the label's row, at the right.
 */
export const ColorField = ({ id, label, help, value, onChange }: Props) => (
  <div className="@container flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
    <label htmlFor={id} className="shrink-0">
      {label}
    </label>
    <span className="ml-auto flex shrink-0 items-center gap-1.5 @max-[250px]:order-2 @max-[250px]:w-full @max-[250px]:justify-end">
      <input
        id={id}
        type="color"
        value={value}
        onChange={onChange}
        className="h-7 w-10 cursor-pointer rounded-md border border-stone-200 bg-white p-0.5 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
      />
    </span>
    {help ? (
      <span className="shrink-0 @max-[250px]:order-1">
        <FieldHelp help={help} label={label} />
      </span>
    ) : null}
  </div>
);
