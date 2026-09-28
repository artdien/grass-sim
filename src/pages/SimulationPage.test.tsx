import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SimulationPage } from '@/pages/SimulationPage';
import { useFullscreenStore } from '@/store/fullscreen';

vi.mock('@/scene/Scene', () => ({
  Scene: () => <div data-testid="scene-stub" />,
}));

describe('SimulationPage', () => {
  beforeEach(() => {
    useFullscreenStore.setState({ isFullscreen: false });
  });

  it('renders the sidebar beside the scene when not in fullscreen', () => {
    render(<SimulationPage />);

    expect(screen.getByTestId('scene-stub')).toBeInTheDocument();
    // A control that only exists in the settings sidebar.
    expect(screen.getByLabelText('Velocity')).toBeInTheDocument();
  });

  it('hides the sidebar, leaving only the scene, in fullscreen', () => {
    useFullscreenStore.setState({ isFullscreen: true });
    render(<SimulationPage />);

    expect(screen.getByTestId('scene-stub')).toBeInTheDocument();
    expect(screen.queryByLabelText('Velocity')).not.toBeInTheDocument();
  });
});
