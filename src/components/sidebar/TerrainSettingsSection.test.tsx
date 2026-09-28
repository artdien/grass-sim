import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { TerrainSettingsSection } from '@/components/sidebar/TerrainSettingsSection';
import { useSimulationStore } from '@/store/simulation';

// The store replaces its state wholesale and never mutates it, so the initial
// default object can be reused as the reset snapshot for every test.
const initialActiveSettings = useSimulationStore.getState().activeSettings;

beforeEach(() => {
  useSimulationStore.setState({ activeSettings: initialActiveSettings });
});

describe('TerrainSettingsSection', () => {
  it('commits a valid terrain size without touching the other terrain fields', () => {
    render(<TerrainSettingsSection />);

    fireEvent.change(screen.getByLabelText('Size'), { target: { value: '150' } });

    const terrain = useSimulationStore.getState().activeSettings.terrain;
    expect(terrain.size).toBe(150);
    expect(terrain.segments).toBe(512);
    expect(terrain.height).toBe(0.01);
  });

  it('refuses a terrain size that is below 1 or not an integer', () => {
    render(<TerrainSettingsSection />);

    const size = screen.getByLabelText('Size');
    fireEvent.change(size, { target: { value: '0' } });
    fireEvent.change(size, { target: { value: '2.5' } });

    expect(useSimulationStore.getState().activeSettings.terrain.size).toBe(200);
  });

  it('commits a valid segment count', () => {
    render(<TerrainSettingsSection />);

    fireEvent.change(screen.getByLabelText('Segments'), { target: { value: '800' } });

    expect(useSimulationStore.getState().activeSettings.terrain.segments).toBe(800);
  });

  it('keeps the segment count at its maximum of 1024 when input is pushed beyond it', () => {
    render(<TerrainSettingsSection />);

    fireEvent.change(screen.getByLabelText('Segments'), { target: { value: '3000' } });

    expect(useSimulationStore.getState().activeSettings.terrain.segments).toBe(1024);
  });

  it('commits a terrain height within [0, 1]', () => {
    render(<TerrainSettingsSection />);

    fireEvent.change(screen.getByLabelText('Height'), { target: { value: '0.5' } });

    expect(useSimulationStore.getState().activeSettings.terrain.height).toBe(0.5);
  });

  it('commits a valid noise frequency', () => {
    render(<TerrainSettingsSection />);

    fireEvent.change(screen.getByLabelText('Frequency'), { target: { value: '0.75' } });

    expect(useSimulationStore.getState().activeSettings.terrain.frequency).toBe(0.75);
  });

  it('keeps the noise frequency at its maximum of 2 when input is pushed beyond it', () => {
    render(<TerrainSettingsSection />);

    fireEvent.change(screen.getByLabelText('Frequency'), { target: { value: '5' } });

    expect(useSimulationStore.getState().activeSettings.terrain.frequency).toBe(2);
  });

  it('commits a terrain color change to terrain.color only', () => {
    render(<TerrainSettingsSection />);

    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#112233' } });

    const terrain = useSimulationStore.getState().activeSettings.terrain;
    expect(terrain.color).toBe('#112233');
    expect(terrain.size).toBe(200);
  });
});
