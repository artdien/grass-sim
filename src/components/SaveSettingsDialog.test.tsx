import type { ComponentProps } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SaveSettingsDialog } from '@/components/SaveSettingsDialog';
import type { Result } from '@/types';

type DialogProps = ComponentProps<typeof SaveSettingsDialog>;

const renderSaveSettingsDialog = (
  onSubmit: DialogProps['onSubmit'] = vi.fn((): Promise<Result> =>
    Promise.resolve({ ok: true, data: undefined }),
  ),
  onClose = vi.fn(),
) => {
  render(<SaveSettingsDialog onSubmit={onSubmit} onClose={onClose} />);
  return { onClose, onSubmit };
};

describe('SaveSettingsDialog', () => {
  it('renders the name input and actions, with no error shown', () => {
    renderSaveSettingsDialog();

    expect(screen.getByRole('heading', { name: 'Store simulation settings' })).toBeInTheDocument();
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('placeholder', 'e.g. Meadow');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });

  it('saves with the entered name and closes on success', async () => {
    const onSubmit = vi.fn((): Promise<Result> => Promise.resolve({ ok: true, data: undefined }));
    const { onClose } = renderSaveSettingsDialog(onSubmit);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Meadow' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith('Meadow');
  });

  it('stays open and shows the error when the save fails', async () => {
    const onSubmit = vi.fn((): Promise<Result> =>
      Promise.resolve({ ok: false, error: 'Name already exists' }),
    );
    const { onClose } = renderSaveSettingsDialog(onSubmit);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Meadow' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Name already exists'));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the error when the name changes and retries with the corrected name', async () => {
    const onSubmit: DialogProps['onSubmit'] = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: 'Name already exists' })
      .mockResolvedValueOnce({ ok: true, data: undefined });
    const { onClose } = renderSaveSettingsDialog(onSubmit);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Meadow' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Meadow copy' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit).toHaveBeenLastCalledWith('Meadow copy');
  });

  it('locks input and dismissal while a save is in flight', () => {
    const onSubmit = vi.fn((): Promise<Result> => new Promise(() => {}));
    const { onClose } = renderSaveSettingsDialog(onSubmit);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Meadow' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    const input = screen.getByLabelText('Name');
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Saving…' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    const backdrop = screen.getByRole('dialog').parentElement as HTMLElement;
    fireEvent.mouseDown(backdrop);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
