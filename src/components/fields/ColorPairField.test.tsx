import type { ChangeEvent } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ColorPairField } from '@/components/fields/ColorPairField';

describe('ColorPairField', () => {
  it('renders base and tip inputs with their values, associated with their labels and derived ids', () => {
    render(
      <ColorPairField
        id="grass-color-1"
        label="Palette 1"
        baseValue="#6ca03f"
        tipValue="#aada7c"
        onBaseChange={() => {}}
        onTipChange={() => {}}
      />,
    );

    const base = screen.getByLabelText('Base');
    expect(base).toBeInstanceOf(HTMLInputElement);
    expect(base).toHaveAttribute('type', 'color');
    expect(base).toHaveAttribute('value', '#6ca03f');
    expect(base).toHaveAttribute('id', 'grass-color-1-base');

    const tip = screen.getByLabelText('Tip');
    expect(tip).toBeInstanceOf(HTMLInputElement);
    expect(tip).toHaveAttribute('type', 'color');
    expect(tip).toHaveAttribute('value', '#aada7c');
    expect(tip).toHaveAttribute('id', 'grass-color-1-tip');
  });

  it('calls onBaseChange with the new color and not onTipChange', () => {
    const onBaseChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('#ff0000');
    });
    const onTipChange = vi.fn();
    render(
      <ColorPairField
        id="grass-color-1"
        label="Palette 1"
        baseValue="#6ca03f"
        tipValue="#aada7c"
        onBaseChange={onBaseChange}
        onTipChange={onTipChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Base'), { target: { value: '#ff0000' } });

    expect(onBaseChange).toHaveBeenCalledTimes(1);
    expect(onTipChange).not.toHaveBeenCalled();
  });

  it('calls onTipChange with the new color and not onBaseChange', () => {
    const onBaseChange = vi.fn();
    const onTipChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      expect(event.target.value).toBe('#0000ff');
    });
    render(
      <ColorPairField
        id="grass-color-1"
        label="Palette 1"
        baseValue="#6ca03f"
        tipValue="#aada7c"
        onBaseChange={onBaseChange}
        onTipChange={onTipChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Tip'), { target: { value: '#0000ff' } });

    expect(onTipChange).toHaveBeenCalledTimes(1);
    expect(onBaseChange).not.toHaveBeenCalled();
  });
});
