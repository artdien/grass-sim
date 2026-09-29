import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { WindSettingsSection } from '@/components/sidebar/WindSettingsSection';
import { useSimulationStore } from '@/store/simulation';

// The store replaces its state wholesale and never mutates it, so the initial
// default object can be reused as the reset snapshot for every test.
const initialActiveSettings = useSimulationStore.getState().activeSettings;

beforeEach(() => {
  useSimulationStore.setState({ activeSettings: initialActiveSettings });
});

describe('WindSettingsSection', () => {
  it('commits a valid velocity change to wind.velocity, leaving the other wind fields alone', () => {
    render(<WindSettingsSection />);

    fireEvent.change(screen.getByLabelText('Velocity'), { target: { value: '0.75' } });

    const wind = useSimulationStore.getState().activeSettings.wind;
    expect(wind.velocity).toBe(0.75);
    expect(wind.randomness).toBe(0.45);
    expect(wind.angle).toBe(115);
  });

  it('commits a valid randomness change to wind.randomness', () => {
    render(<WindSettingsSection />);

    fireEvent.change(screen.getByLabelText('Randomness'), { target: { value: '0.7' } });

    expect(useSimulationStore.getState().activeSettings.wind.randomness).toBe(0.7);
  });

  it('commits a valid angle change to wind.angle, leaving the other wind fields alone', () => {
    render(<WindSettingsSection />);

    fireEvent.change(screen.getByLabelText('Angle'), { target: { value: '90' } });

    const wind = useSimulationStore.getState().activeSettings.wind;
    expect(wind.angle).toBe(90);
    expect(wind.velocity).toBe(0.5);
    expect(wind.randomness).toBe(0.45);
  });

  it('keeps the velocity at its maximum when input is pushed beyond it', () => {
    render(<WindSettingsSection />);

    fireEvent.change(screen.getByLabelText('Velocity'), { target: { value: '1.5' } });

    expect(useSimulationStore.getState().activeSettings.wind.velocity).toBe(1);
  });
});
