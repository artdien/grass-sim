import type { ChangeEvent } from 'react';
import { CollapsibleSection } from '@/components/layout/CollapsibleSection';
import { SliderField } from '@/components/fields/SliderField';
import { useSimulationStore } from '@/store/simulation';

/** Parses the wind velocity or strength; null when not a number in [0, 1]. */
const parseUnitRangeValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : null;
};

/** Parses the wind angle; null when not a number of degrees in [0, 360]. */
const parseAngleValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 360 ? parsed : null;
};

/** The Wind settings section: how fast and how hard the grass bends, and the direction it blows toward. The angle is in degrees; the scene converts it to radians for the shader. */
export const WindSettingsSection = () => {
  const activeSettings = useSimulationStore((state) => state.activeSettings);
  const updateActiveSettings = useSimulationStore((state) => state.updateActiveSettings);

  // Invalid input is not committed, so the field snaps back to its last valid value.
  const handleUnitRangeChange = (
    field: 'velocity' | 'strength',
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const parsed = parseUnitRangeValue(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      wind: { ...activeSettings.wind, [field]: parsed },
    });
  };

  const handleAngleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseAngleValue(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      wind: { ...activeSettings.wind, angle: parsed },
    });
  };

  return (
    <CollapsibleSection title="Wind">
      <div className="space-y-3">
        <SliderField
          id="wind-velocity"
          label="Velocity"
          min={0}
          max={1}
          step={0.05}
          value={activeSettings.wind.velocity}
          onChange={(event) => handleUnitRangeChange('velocity', event)}
        />

        <SliderField
          id="wind-strength"
          label="Strength"
          min={0}
          max={1}
          step={0.05}
          value={activeSettings.wind.strength}
          onChange={(event) => handleUnitRangeChange('strength', event)}
        />

        <SliderField
          id="wind-angle"
          label="Angle"
          min={0}
          max={360}
          step={1}
          value={activeSettings.wind.angle}
          onChange={handleAngleChange}
        />
      </div>
    </CollapsibleSection>
  );
};
