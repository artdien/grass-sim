import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoadSettingsPage } from '@/pages/LoadSettingsPage';
import { useSimulationStore } from '@/store/simulation';
import type { StoredSimulationSettings } from '@/types';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

// The store replaces its state wholesale, so the initial default object can be
// reused as the reset snapshot for every test.
const initialActiveSettings = useSimulationStore.getState().activeSettings;

// An entry whose settings differ from the store defaults, so "applied" is
// checkable rather than trivially true.
const entry: StoredSimulationSettings = {
  name: 'Alpha',
  image: 'aW1hZ2U',
  settings: {
    ...initialActiveSettings,
    wind: { velocity: 0.9, randomness: 0.4, angle: 45 },
  },
};

beforeEach(() => {
  useSimulationStore.setState({ activeSettings: initialActiveSettings, storedSettings: [] });
  navigateMock.mockClear();
});

describe('LoadSettingsPage', () => {
  it('shows an empty box when no settings are stored', () => {
    render(<LoadSettingsPage />);

    expect(
      screen.getByRole('heading', { name: 'No simulation settings stored yet' }),
    ).toBeInTheDocument();
  });

  it('applies an entry to the active settings and navigates to /simulation on Load', () => {
    useSimulationStore.getState().importSettings(entry);
    render(<LoadSettingsPage />);

    fireEvent.click(screen.getByText('Load'));

    expect(useSimulationStore.getState().activeSettings.wind.velocity).toBe(0.9);
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/simulation');
  });

  it('removes the entry when the delete is confirmed', () => {
    useSimulationStore.getState().importSettings(entry);
    render(<LoadSettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Alpha' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(useSimulationStore.getState().storedSettings).toHaveLength(0);
  });

  it('keeps the entry when the delete is cancelled', () => {
    useSimulationStore.getState().importSettings(entry);
    render(<LoadSettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Alpha' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useSimulationStore.getState().storedSettings.map((item) => item.name)).toEqual([
      'Alpha',
    ]);
  });
});
