import type { ChangeEvent } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ColorField } from '@/components/fields/ColorField';

describe('ColorField', () => {
  it('renders a color input with the given value, associated with its label', () => {
    render(<ColorField id="grass-color" label="Grass color" value="#00ff00" onChange={() => {}} />);

    const input = screen.getByLabelText('Grass color');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input).toHaveAttribute('type', 'color');
    expect(input).toHaveAttribute('value', '#00ff00');
    expect(input).toHaveAttribute('id', 'grass-color');
  });

  it('calls onChange with the new color', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('#0000ff');
    });
    render(<ColorField id="grass-color" label="Grass color" value="#00ff00" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Grass color'), { target: { value: '#0000ff' } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
