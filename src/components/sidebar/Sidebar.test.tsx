import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Sidebar } from '@/components/sidebar/Sidebar';
import type { ScreenshotResult } from '@/scene/screenshot';
import { captureSceneScreenshot } from '@/scene/screenshot';
import { useSimulationStore } from '@/store/simulation';

vi.mock('@/scene/screenshot', () => ({
  captureSceneScreenshot: vi.fn((): Promise<ScreenshotResult> =>
    Promise.resolve({ ok: true, data: 'png' }),
  ),
}));

// The store replaces its state wholesale and never mutates it, so the initial
// default object can be reused as the reset snapshot for every test.
const initialActiveSettings = useSimulationStore.getState().activeSettings;

const saveWith = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  const dialog = screen.getByRole('dialog');
  const saveButton = within(dialog).getByRole('button', { name: 'Save' });

  if (name !== '') {
    fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: name } });
  }

  fireEvent.click(saveButton);
};

beforeEach(() => {
  useSimulationStore.setState({ activeSettings: initialActiveSettings, storedSettings: [] });
  vi.mocked(captureSceneScreenshot).mockResolvedValue({ ok: true, data: 'png' });
});

describe('Sidebar', () => {
  it('collapses to its toggle icon and restores the settings on click', () => {
    render(<Sidebar />);

    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
    expect(screen.getByText('Shadowing')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText('Shadowing')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));

    expect(screen.queryByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('resizes by dragging the separator', () => {
    const { container } = render(<Sidebar />);
    const handle = screen.getByRole('separator', { name: 'Resize sidebar' });

    fireEvent.pointerDown(handle, { clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 600 });
    fireEvent.pointerUp(window);

    expect(container.querySelector('aside')).toHaveStyle({ width: '600px' });
    expect(handle).toHaveAttribute('aria-label', 'Resize sidebar');
  });

  it('clamps a drag below the minimum width to the minimum', () => {
    const { container } = render(<Sidebar />);
    const handle = screen.getByRole('separator', { name: 'Resize sidebar' });

    fireEvent.pointerDown(handle, { clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 100 });
    fireEvent.pointerUp(window);

    expect(container.querySelector('aside')).toHaveStyle({ width: '224px' });
  });

  it('saves the current settings under the given name and closes the dialog', async () => {
    render(<Sidebar />);

    saveWith('Meadow');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(vi.mocked(captureSceneScreenshot)).toHaveBeenCalledTimes(1);

    const [stored] = useSimulationStore.getState().storedSettings;
    expect(stored.name).toBe('Meadow');
    expect(stored.image).toBe('png');
    expect(stored.settings.wind.velocity).toBe(0.5);
    expect(stored.settings.grass.bladeWidth).toBe(0.5);
  });

  it('refuses to save an empty name and keeps the dialog open', async () => {
    render(<Sidebar />);

    saveWith('');

    expect(await screen.findByRole('alert')).toHaveTextContent('Name is empty.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(useSimulationStore.getState().storedSettings).toHaveLength(0);
  });

  it('refuses to save a name that is already stored and keeps the dialog open', async () => {
    useSimulationStore.getState().saveSettings('Meadow', 'seed');
    render(<Sidebar />);

    saveWith('Meadow');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Settings with this name are already stored.',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(useSimulationStore.getState().storedSettings).toHaveLength(1);
  });

  it('surfaces a capture failure and keeps the dialog open', async () => {
    vi.mocked(captureSceneScreenshot).mockResolvedValue({
      ok: false,
      error: 'CAPTURE_FAILED',
    });
    render(<Sidebar />);

    saveWith('Meadow');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not capture a snapshot of the current render. Please try again.',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(useSimulationStore.getState().storedSettings).toHaveLength(0);
  });
});
