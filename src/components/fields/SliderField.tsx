import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { FieldHelp } from '@/components/fields/FieldHelp';
import { useWheelStepper } from '@/components/fields/useWheelStepper';

interface Props {
  /** Unique id of the input, used to bind the label. */
  id: string;

  /** Text shown to the left of the input. */
  label: string;

  /** Optional explanation behind the help icon rendered next to the input. */
  help?: string;

  /** Current value committed to the settings. */
  value: number;

  /** Minimum allowed value (rendered as the `min` attribute). */
  min: number;

  /** Maximum allowed value (rendered as the `max` attribute). */
  max: number;

  /** Step increment (rendered as the `step` attribute). */
  step?: number;

  /** Fires with the change event; the caller parses and validates before committing. */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** Labeled native range input, matching the label rows of the settings sidebar. */
export const SliderField = ({ id, label, help, value, min, max, step, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useWheelStepper(inputRef, onChange);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
      <label htmlFor={id} className="shrink-0">
        {label}
      </label>
      <span className="flex shrink-0 items-center gap-1.5">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          ref={inputRef}
          className="w-24 cursor-pointer accent-green-600 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
        />
        {help ? <FieldHelp help={help} label={label} /> : null}
      </span>
    </div>
  );
};
