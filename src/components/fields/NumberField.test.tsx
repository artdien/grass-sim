import type { ChangeEvent } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NumberField } from '@/components/fields/NumberField';

describe('NumberField', () => {
  it('renders a number input with the given value and bounds, associated with its label', () => {
    render(
      <NumberField
        id="blades"
        label="Blades"
        value={24}
        min={8}
        max={64}
        step={1}
        onChange={() => {}}
      />,
    );

    const input = screen.getByLabelText('Blades');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('value', '24');
    expect(input).toHaveAttribute('min', '8');
    expect(input).toHaveAttribute('max', '64');
    expect(input).toHaveAttribute('step', '1');
    expect(input).toHaveAttribute('id', 'blades');
  });

  it('calls onChange with the new value', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('48');
    });
    render(
      <NumberField
        id="blades"
        label="Blades"
        value={24}
        min={8}
        max={64}
        step={1}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Blades'), { target: { value: '48' } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not forward an edit the browser reports as an empty string', () => {
    const onChange = vi.fn();
    render(
      <NumberField
        id="blades"
        label="Blades"
        value={24}
        min={8}
        max={64}
        step={1}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Blades'), { target: { value: '' } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('steps up one increment per wheel tick', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('25');
    });
    render(
      <NumberField
        id="blades"
        label="Blades"
        value={24}
        min={8}
        max={64}
        step={1}
        onChange={onChange}
      />,
    );

    fireEvent.wheel(screen.getByLabelText('Blades'), { deltaY: -1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('steps down one increment per wheel tick, clamped to min', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('8');
    });
    render(
      <NumberField
        id="blades"
        label="Blades"
        value={8}
        min={8}
        max={64}
        step={1}
        onChange={onChange}
      />,
    );

    fireEvent.wheel(screen.getByLabelText('Blades'), { deltaY: 1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
