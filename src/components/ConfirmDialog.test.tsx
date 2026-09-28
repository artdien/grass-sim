import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/components/ConfirmDialog';

const renderConfirmDialog = (
  props: Partial<ComponentProps<typeof ConfirmDialog>> = {},
  onCancel = vi.fn(),
  onConfirm = vi.fn(),
) => {
  render(
    <ConfirmDialog
      title="Reset"
      message="Reset all settings to defaults?"
      confirmLabel="Reset"
      cancelLabel="Cancel"
      onCancel={onCancel}
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { onCancel, onConfirm };
};

describe('ConfirmDialog', () => {
  it('renders the heading, message, and both actions', () => {
    renderConfirmDialog();

    expect(screen.getByRole('heading', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByText('Reset all settings to defaults?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    const { onConfirm } = renderConfirmDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel button is clicked', () => {
    const { onCancel } = renderConfirmDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape is pressed', () => {
    const { onCancel } = renderConfirmDialog();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel on a backdrop mousedown, not on a mousedown inside the dialog', () => {
    const { onCancel } = renderConfirmDialog();
    const backdrop = screen.getByRole('dialog', { name: 'Reset' }).parentElement as HTMLElement;

    fireEvent.mouseDown(screen.getByRole('dialog', { name: 'Reset' }));
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.mouseDown(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows only the confirm action when cancelLabel is omitted, with focus on it', () => {
    renderConfirmDialog({ cancelLabel: undefined });

    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toHaveFocus();
  });
});
