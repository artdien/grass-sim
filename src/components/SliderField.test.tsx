import type { ChangeEvent } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SliderField } from '@/components/SliderField';

describe('SliderField', () => {
  it('renders a range input with the given value and bounds, associated with its label', () => {
    render(
      <SliderField
        id="density"
        label="Density"
        value={2.5}
        min={0}
        max={10}
        step={0.5}
        onChange={() => {}}
      />,
    );

    const input = screen.getByLabelText('Density');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input).toHaveAttribute('type', 'range');
    expect(input).toHaveAttribute('value', '2.5');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '10');
    expect(input).toHaveAttribute('step', '0.5');
    expect(input).toHaveAttribute('id', 'density');
  });

  it('calls onChange with the new value', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('4');
    });
    render(
      <SliderField
        id="density"
        label="Density"
        value={2.5}
        min={0}
        max={10}
        step={0.5}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Density'), { target: { value: '4' } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('steps up one increment per wheel tick', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('3');
    });
    render(
      <SliderField
        id="density"
        label="Density"
        value={2.5}
        min={0}
        max={10}
        step={0.5}
        onChange={onChange}
      />,
    );

    fireEvent.wheel(screen.getByLabelText('Density'), { deltaY: -1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('steps down one increment per wheel tick, clamped to min', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('0');
    });
    render(
      <SliderField
        id="density"
        label="Density"
        value={0.5}
        min={0}
        max={10}
        step={0.5}
        onChange={onChange}
      />,
    );

    fireEvent.wheel(screen.getByLabelText('Density'), { deltaY: 1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
