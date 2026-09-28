import type { ChangeEvent } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VectorField } from '@/components/fields/VectorField';

const renderVectorField = (onChange = vi.fn()) =>
  render(
    <VectorField
      id="wind"
      label="Wind"
      value={{ x: 1, y: 2, z: 3 }}
      step={0.5}
      onChange={onChange}
    />,
  );

describe('VectorField', () => {
  it('renders an x, y, and z number input per component, each bound to its value', () => {
    renderVectorField();

    for (const [id, component, value] of [
      ['wind-x', 'x', 1],
      ['wind-y', 'y', 2],
      ['wind-z', 'z', 3],
    ] as const) {
      const input = screen.getByLabelText(`Wind ${component.toUpperCase()}`);
      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('value', String(value));
      expect(input).toHaveAttribute('step', '0.5');
      expect(input).toHaveAttribute('id', id);
    }
  });

  it('calls onChange with the changed component and the raw event', () => {
    const onChange = vi.fn((component: 'x' | 'y' | 'z', event: ChangeEvent<HTMLInputElement>) => {
      expect(component).toBe('y');
      expect(event.target.value).toBe('7');
    });
    renderVectorField(onChange);

    fireEvent.change(screen.getByLabelText('Wind Y'), { target: { value: '7' } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
