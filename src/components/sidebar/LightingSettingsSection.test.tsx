import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { LightingSettingsSection } from '@/components/sidebar/LightingSettingsSection';
import { useSimulationStore } from '@/store/simulation';

// The store replaces its state wholesale and never mutates it, so the initial
// default object can be reused as the reset snapshot for every test.
const initialActiveSettings = useSimulationStore.getState().activeSettings;

beforeEach(() => {
  useSimulationStore.setState({ activeSettings: initialActiveSettings });
});

describe('LightingSettingsSection', () => {
  it('commits a hemisphere sky color change, touching only that field', () => {
    render(<LightingSettingsSection />);

    fireEvent.change(screen.getByLabelText('Sky color'), { target: { value: '#112233' } });

    const lighting = useSimulationStore.getState().activeSettings.lighting;
    expect(lighting.hemisphere.skyColor).toBe('#112233');
    expect(lighting.hemisphere.groundColor).toBe('#856a4f');
    expect(lighting.diffuse.color).toBe('#ff7800');
  });

  it('commits a diffuse light color change, touching only that field', () => {
    render(<LightingSettingsSection />);

    fireEvent.change(screen.getByLabelText('Light color'), { target: { value: '#ff8800' } });

    const lighting = useSimulationStore.getState().activeSettings.lighting;
    expect(lighting.diffuse.color).toBe('#ff8800');
    expect(lighting.hemisphere.skyColor).toBe('#99c1f1');
  });

  it('commits a light direction component, leaving the other two untouched', () => {
    render(<LightingSettingsSection />);

    fireEvent.change(screen.getByLabelText('Direction Y'), { target: { value: '0.3' } });

    const direction = useSimulationStore.getState().activeSettings.lighting.diffuse.direction;
    expect(direction.y).toBe(0.3);
    expect(direction.x).toBe(-0.5);
    expect(direction.z).toBe(-0.5);
  });

  it('keeps the last direction component when the input is cleared, since it would read as a zero', () => {
    render(<LightingSettingsSection />);

    fireEvent.change(screen.getByLabelText('Direction X'), { target: { value: '' } });

    expect(useSimulationStore.getState().activeSettings.lighting.diffuse.direction.x).toBe(-0.5);
  });

  it('refuses a shininess that is below 1 or not an integer', () => {
    render(<LightingSettingsSection />);

    const shininess = screen.getByLabelText('Shininess');
    fireEvent.change(shininess, { target: { value: '0' } });
    fireEvent.change(shininess, { target: { value: '0.5' } });

    expect(useSimulationStore.getState().activeSettings.lighting.specular.shininess).toBe(32);
  });

  it('commits a shininess of exactly 1, the inclusive lower bound', () => {
    render(<LightingSettingsSection />);

    fireEvent.change(screen.getByLabelText('Shininess'), { target: { value: '1' } });

    expect(useSimulationStore.getState().activeSettings.lighting.specular.shininess).toBe(1);
  });

  it('commits an intensity of exactly 0, the inclusive lower bound', () => {
    render(<LightingSettingsSection />);

    fireEvent.change(screen.getByLabelText('Intensity'), { target: { value: '0' } });

    expect(useSimulationStore.getState().activeSettings.lighting.specular.intensity).toBe(0);
  });

  it('commits an intensity of exactly 1, the inclusive upper bound', () => {
    render(<LightingSettingsSection />);

    fireEvent.change(screen.getByLabelText('Intensity'), { target: { value: '1' } });

    expect(useSimulationStore.getState().activeSettings.lighting.specular.intensity).toBe(1);
  });

  it('commits an environment strength of exactly 1, the inclusive upper bound', () => {
    render(<LightingSettingsSection />);

    fireEvent.change(screen.getByLabelText('Strength'), { target: { value: '1' } });

    expect(useSimulationStore.getState().activeSettings.lighting.environment.strength).toBe(1);
  });
});
