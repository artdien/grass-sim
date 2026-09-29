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

/**
 * Labeled native range input, one row at the settings sidebar's default width with the
 * slider and help icon right-aligned;
 * below 250px of available width the slider collapses to the row below, right-aligned,
 * while the help icon stays on the label's row, at the right.
 */
export const SliderField = ({ id, label, help, value, min, max, step, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useWheelStepper(inputRef, onChange);

  return (
    <div className="@container flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
      <label htmlFor={id} className="shrink-0">
        {label}
      </label>
      <span className="ml-auto flex shrink-0 items-center gap-1.5 @max-[250px]:order-2 @max-[250px]:w-full @max-[250px]:justify-end">
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
      </span>
      {help ? (
        <span className="shrink-0 @max-[250px]:order-1">
          <FieldHelp help={help} label={label} />
        </span>
      ) : null}
    </div>
  );
};
