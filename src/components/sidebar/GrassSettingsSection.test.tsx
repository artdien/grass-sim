import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { GrassSettingsSection } from '@/components/sidebar/GrassSettingsSection';
import { useSimulationStore } from '@/store/simulation';

// The store replaces its state wholesale and never mutates it, so the initial
// default object can be reused as the reset snapshot for every test.
const initialActiveSettings = useSimulationStore.getState().activeSettings;

beforeEach(() => {
  useSimulationStore.setState({ activeSettings: initialActiveSettings });
});

describe('GrassSettingsSection', () => {
  it('commits a blade width at the inclusive upper bound of (0, 1]', () => {
    render(<GrassSettingsSection />);

    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '1' } });

    expect(useSimulationStore.getState().activeSettings.grass.bladeWidth).toBe(1);
  });

  it('refuses a blade width of zero, keeping the stored value', () => {
    render(<GrassSettingsSection />);

    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '0' } });

    expect(useSimulationStore.getState().activeSettings.grass.bladeWidth).toBe(0.2);
  });

  it('keeps the blade width at its maximum of 1 when input is pushed beyond it', () => {
    render(<GrassSettingsSection />);

    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '1.5' } });

    expect(useSimulationStore.getState().activeSettings.grass.bladeWidth).toBe(1);
  });

  it('commits a valid blade bending in degrees, leaving the other blade fields alone', () => {
    render(<GrassSettingsSection />);

    fireEvent.change(screen.getByLabelText('Bending'), { target: { value: '30' } });

    const grass = useSimulationStore.getState().activeSettings.grass;
    expect(grass.bladeBending).toBe(30);
    expect(grass.bladeWidth).toBe(0.2);
    expect(grass.bladeHeight).toBe(1.5);
  });

  it('keeps the blade bending at its maximum of 45 degrees when input is pushed beyond it', () => {
    render(<GrassSettingsSection />);

    fireEvent.change(screen.getByLabelText('Bending'), { target: { value: '60' } });

    expect(useSimulationStore.getState().activeSettings.grass.bladeBending).toBe(45);
  });

  it('keeps the shadowing at its maximum of 10 when input is pushed beyond it', () => {
    render(<GrassSettingsSection />);

    fireEvent.change(screen.getByLabelText('Shadowing'), { target: { value: '12' } });

    expect(useSimulationStore.getState().activeSettings.grass.shadowing).toBe(10);
  });

  it('commits a color change to the given palette slot only', () => {
    render(<GrassSettingsSection />);

    const base1 = document.getElementById('grass-color-1-base') as HTMLInputElement;
    fireEvent.change(base1, { target: { value: '#ff0000' } });

    const grass = useSimulationStore.getState().activeSettings.grass;
    expect(grass.baseColor1).toBe('#ff0000');
    expect(grass.tipColor1).toBe('#aada7c');
    expect(grass.baseColor2).toBe('#6ca03f');
  });
});
