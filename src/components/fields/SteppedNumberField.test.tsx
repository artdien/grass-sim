import type { ChangeEvent } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SteppedNumberField } from '@/components/fields/SteppedNumberField';

const renderSteppedNumberField = (
  props: Partial<{
    value: number;
    min: number;
    max: number;
    step: number;
    ariaLabel: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  }> = {},
) => {
  render(
    <SteppedNumberField
      id="strength"
      value={props.value ?? 2}
      min={props.min}
      max={props.max}
      step={props.step}
      ariaLabel={props.ariaLabel}
      className="w-12 rounded-md border border-stone-200 bg-white"
      onChange={props.onChange ?? (() => {})}
    />,
  );

  return screen.getByRole('spinbutton');
};

describe('SteppedNumberField', () => {
  it('renders a number input with the given value, id, bounds, step, and classes', () => {
    const input = renderSteppedNumberField({ min: 0, max: 10, step: 0.5, ariaLabel: 'Strength' });

    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('value', '2');
    expect(input).toHaveAttribute('id', 'strength');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '10');
    expect(input).toHaveAttribute('step', '0.5');
    expect(input).toHaveAttribute('aria-label', 'Strength');
    expect(input.className).toContain('w-12');
  });

  it('leaves min, max, and aria-label unset when they are not given', () => {
    const input = renderSteppedNumberField();

    expect(input).not.toHaveAttribute('min');
    expect(input).not.toHaveAttribute('max');
    expect(input).not.toHaveAttribute('aria-label');
  });

  it('calls onChange with the change event', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('5');
    });
    const input = renderSteppedNumberField({ onChange });

    fireEvent.change(input, { target: { value: '5' } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not call onChange for an edit the browser reports as an empty string', () => {
    const onChange = vi.fn();
    const input = renderSteppedNumberField({ onChange });

    fireEvent.change(input, { target: { value: '' } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('steps up one increment per wheel tick, forwarded through onChange', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('2.5');
    });
    const input = renderSteppedNumberField({ step: 0.5, onChange });

    fireEvent.wheel(input, { deltaY: -1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('still forwards a wheel step that lands on zero', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('0');
    });
    const input = renderSteppedNumberField({ value: 0.5, min: 0, step: 0.5, onChange });

    fireEvent.wheel(input, { deltaY: 1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
