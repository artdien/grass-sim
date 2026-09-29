import type { ChangeEvent } from 'react';
import { SteppedNumberField } from '@/components/fields/SteppedNumberField';

interface Props {
  /** Unique id of the input, used to bind the label. */
  id: string;

  /** Text shown to the left of the input. */
  label: string;

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
export const NumberField = ({ id, label, value, min, max, step, onChange }: Props) => {
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-2 text-sm text-stone-600">
      {label}
      <SteppedNumberField
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        className="w-24 rounded-md border border-stone-200 bg-white px-2 py-1 text-right font-mono text-xs text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
      />
    </label>
  );
};
