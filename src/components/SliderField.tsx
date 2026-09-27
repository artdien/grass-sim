import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useWheelStepper } from '@/components/useWheelStepper';

interface Props {
  /** Unique id of the input, used to bind the label. */
  id: string;

  /** Text shown to the left of the input. */
  label: string;

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
export const SliderField = ({ id, label, value, min, max, step, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useWheelStepper(inputRef, onChange);

  return (
    <label htmlFor={id} className="flex items-center justify-between gap-2 text-sm text-stone-600">
      {label}
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
    </label>
  );
};
