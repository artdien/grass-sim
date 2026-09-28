import type { StoredSimulationSettings } from '@/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoadSettingsCard } from '@/components/LoadSettingsCard';
import { useSimulationStore } from '@/store/simulation';

const entry: StoredSimulationSettings = {
  name: 'My meadow',
  image: 'aW1hZ2U',
  settings: useSimulationStore.getState().activeSettings,
};

const renderCard = (onLoad = vi.fn(), onDownload = vi.fn(), onAskDelete = vi.fn()) => {
  render(
    <LoadSettingsCard
      entry={entry}
      onLoad={onLoad}
      onDownload={onDownload}
      onAskDelete={onAskDelete}
    />,
  );
  return { onLoad, onDownload, onAskDelete };
};

describe('LoadSettingsCard', () => {
  it('renders the entry name, its snapshot image, and the Load and Download actions', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: 'My meadow' })).toBeInTheDocument();
    expect(screen.getByAltText('Render screenshot of My meadow')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByText('Load')).toBeInTheDocument();
  });

  it('calls onAskDelete when the delete button is clicked', () => {
    const { onAskDelete } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Delete My meadow' }));

    expect(onAskDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onDownload when the Download button is clicked', () => {
    const { onDownload } = renderCard();

    fireEvent.click(screen.getByText('Download'));

    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('calls onLoad when the Load button is clicked', () => {
    const { onLoad } = renderCard();

    fireEvent.click(screen.getByText('Load'));

    expect(onLoad).toHaveBeenCalledTimes(1);
  });
});
