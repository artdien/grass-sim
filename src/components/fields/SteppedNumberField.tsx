import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useWheelStepper } from '@/components/fields/useWheelStepper';

interface Props {
  /** Unique id of the input, so callers can bind a label or tooltip to it. */
  id: string;

  /** Current numeric value committed to the settings. */
  value: number;

  /** Minimum allowed value (rendered as the `min` attribute). */
  min?: number;

  /** Maximum allowed value (rendered as the `max` attribute). */
  max?: number;

  /** Step increment (rendered as the `step` attribute). */
  step?: number;

  /** Accessible name, for usages without a bound visible label. */
  ariaLabel?: string;

  /** Classes that style the input for its usage. */
  className: string;

  /**
   * Fires with the change event; the caller parses and validates before committing.
   * Not fired for edits whose value the browser reports as `""`.
   */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * `type="number"` input, steppable with the mouse wheel like the other settings fields.
 *
 * Edits whose value the browser reports as `""` (e.g. a minus sign it cannot insert)
 * are swallowed instead of forwarded: `Number("")` is `0`, so committing it would
 * zero the field and erase the last committed value.
 */
export const SteppedNumberField = ({
  id,
  value,
  min,
  max,
  step,
  ariaLabel,
  className,
  onChange,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === '') {
      return;
    }
    onChange(event);
  };

  useWheelStepper(inputRef, handleChange);

  return (
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={handleChange}
      aria-label={ariaLabel}
      ref={inputRef}
      className={className}
    />
  );
};
