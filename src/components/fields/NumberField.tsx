import type { ChangeEvent } from 'react';
import { FieldHelp } from '@/components/fields/FieldHelp';
import { SteppedNumberField } from '@/components/fields/SteppedNumberField';

interface Props {
  /** Unique id of the input, used to bind the label. */
  id: string;

  /** Text shown to the left of the input. */
  label: string;

  /** Optional explanation behind the help icon rendered next to the input. */
  help?: string;

  /** Current numeric value committed to the settings. */
  value: number;

  /** Minimum allowed value (rendered as the `min` attribute). */
  min?: number;

  /** Maximum allowed value (rendered as the `max` attribute). */
  max?: number;

  /** Step increment (rendered as the `step` attribute). */
  step?: number;

  /** Fires with the change event; the caller parses and validates before committing. */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** Labeled native number input, matching the label rows of the settings sidebar. */
export const NumberField = ({ id, label, help, value, min, max, step, onChange }: Props) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
      <label htmlFor={id} className="shrink-0">
        {label}
      </label>
      <span className="flex shrink-0 items-center gap-1.5">
        <SteppedNumberField
          id={id}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          className="w-24 rounded-md border border-stone-200 bg-white px-2 py-1 text-right font-mono text-xs text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
        />
        {help ? <FieldHelp help={help} label={label} /> : null}
      </span>
    </div>
  );
};
