import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useWheelStepper } from '@/components/fields/useWheelStepper';

/** Minimal harness: the hook plus just the input whose live value it steps. */
const StepperInput = ({
  value,
  step,
  min,
  max,
  onChange,
}: {
  value: number;
  step: number;
  min?: string;
  max?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useWheelStepper(inputRef, onChange);

  return (
    <input
      ref={inputRef}
      value={value}
      step={step}
      min={min ?? ''}
      max={max ?? ''}
      onChange={() => {}}
    />
  );
};

const renderStepper = (
  props: { value: number; step: number; min?: string; max?: string },
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void,
) => {
  const { container } = render(
    <StepperInput
      value={props.value}
      step={props.step}
      min={props.min}
      max={props.max}
      onChange={onChange ?? (() => {})}
    />,
  );

  return container.querySelector('input') as HTMLInputElement;
};

describe('useWheelStepper', () => {
  it('steps the value up by one input step on an upward wheel', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('1.1');
    });
    const input = renderStepper({ value: 1, step: 0.1 }, onChange);

    fireEvent.wheel(input, { deltaY: -1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('steps the value down by one input step on a downward wheel', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('0.9');
    });
    const input = renderStepper({ value: 1, step: 0.1 }, onChange);

    fireEvent.wheel(input, { deltaY: 1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('clamps the next value to the input maximum', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('10');
    });
    const input = renderStepper({ value: 9.95, step: 0.1, max: '10' }, onChange);

    fireEvent.wheel(input, { deltaY: -1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('clamps the next value to the input minimum', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('0');
    });
    const input = renderStepper({ value: 0.1, step: 0.1, min: '0' }, onChange);

    fireEvent.wheel(input, { deltaY: 1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('steps from the nearest step-grid point when the input value is off grid', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('0.2');
    });
    const input = renderStepper({ value: 0.14, step: 0.1 }, onChange);

    fireEvent.wheel(input, { deltaY: -1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("keeps the result at the step's decimal precision", () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('0.55');
    });
    const input = renderStepper({ value: 0.5, step: 0.05 }, onChange);

    fireEvent.wheel(input, { deltaY: -1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('steps from the input value currently in the DOM, without re-subscribing', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) =>
      expect(event.target.value).toBe(['1.1', '1.2'][onChange.mock.calls.length - 1]),
    );
    const input = renderStepper({ value: 1, step: 0.1 }, onChange);

    fireEvent.wheel(input, { deltaY: -1 });
    input.value = '1.1';
    fireEvent.wheel(input, { deltaY: -1 });

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('prevents the default wheel action so the surrounding page does not scroll', () => {
    const input = renderStepper({ value: 1, step: 0.1 });

    const preventDefault = vi.spyOn(Event.prototype, 'preventDefault');
    input.dispatchEvent(new WheelEvent('wheel', { deltaMode: 0, deltaY: -1, bubbles: true }));

    expect(preventDefault).toHaveBeenCalledTimes(1);
    preventDefault.mockRestore();
  });
});
