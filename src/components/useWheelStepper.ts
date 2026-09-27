import { useEffect } from 'react';
import type { ChangeEvent, RefObject } from 'react';

/**
 * Steps the value of a numeric or range input with the mouse wheel.
 *
 * Each wheel tick moves the value by one input step (wheel up = +, wheel down = −),
 * rounds it back to the step grid, clamps it to `min`/`max` when set, then fires
 * `onChange` with a synthetic change event whose `target.value` is the new value.
 *
 * @param inputRef ref to the input element the listener is attached to.
 * @param onChange callback fired with the synthesized change event.
 */
export const useWheelStepper = (
  inputRef: RefObject<HTMLInputElement | null>,
  onChange: (event: ChangeEvent<HTMLInputElement>) => void,
) => {
  useEffect(() => {
    const input = inputRef.current;
    if (input === null) {
      return;
    }

    // React registers onWheel as passive, so a native listener is
    // required to preventDefault the surrounding sidebar scroll.
    const stepOnWheel = (event: WheelEvent) => {
      event.preventDefault();

      const step = Number(input.step) || 1;
      const stepDecimals = String(step).split('.')[1]?.length ?? 0;
      const direction = event.deltaY < 0 ? 1 : -1;
      const increments = Math.round(Number(input.value) / step) + direction;

      // Float multiplication can carry trailing digits (e.g. 11 * 0.05 =
      // 0.5500000000000001), so re-round to the step's decimal precision.
      let next = Number((increments * step).toFixed(stepDecimals));

      if (input.min !== '') {
        next = Math.max(Number(input.min), next);
      }
      if (input.max !== '') {
        next = Math.min(Number(input.max), next);
      }

      onChange({ target: { value: String(next) } } as ChangeEvent<HTMLInputElement>);
    };

    input.addEventListener('wheel', stepOnWheel, { passive: false });
    return () => input.removeEventListener('wheel', stepOnWheel);
  }, [inputRef, onChange]);
};
