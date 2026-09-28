import type { ChangeEvent } from 'react';
import { CollapsibleSection } from '@/components/layout/CollapsibleSection';
import { ColorField } from '@/components/fields/ColorField';
import { NumberField } from '@/components/fields/NumberField';
import { SliderField } from '@/components/fields/SliderField';
import { useSimulationStore } from '@/store/simulation';

/** Above this the noise aliases and the terrain becomes high-frequency detail. */
const MAX_TERRAIN_FREQUENCY = 2.0;

/** Parses the terrain height; null when it is not a number in [0, 1]. */
const parseTerrainHeight = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : null;
};

/** Parses the terrain noise frequency; null when it is not a number ≥ 0. */
const parseTerrainFloat = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

/** The Terrain settings section: height, frequency, and base color. */
export const TerrainSettingsSection = () => {
  const activeSettings = useSimulationStore((state) => state.activeSettings);
  const updateActiveSettings = useSimulationStore((state) => state.updateActiveSettings);

  // Invalid input is not committed, so the field snaps back to its last valid value.
  const handleTerrainHeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseTerrainHeight(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      terrain: { ...activeSettings.terrain, height: parsed },
    });
  };

  const handleTerrainFrequencyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseTerrainFloat(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      terrain: { ...activeSettings.terrain, frequency: Math.min(parsed, MAX_TERRAIN_FREQUENCY) },
    });
  };

  const handleTerrainColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateActiveSettings({
      ...activeSettings,
      terrain: { ...activeSettings.terrain, color: event.target.value },
    });
  };

  return (
    <CollapsibleSection title="Terrain">
      <div className="space-y-3">
        <SliderField
          id="terrain-height"
          label="Height"
          min={0}
          max={1}
          step={0.01}
          value={activeSettings.terrain.height}
          onChange={handleTerrainHeightChange}
        />

        <NumberField
          id="terrain-frequency"
          label="Frequency"
          min={0}
          max={MAX_TERRAIN_FREQUENCY}
          step={0.05}
          value={activeSettings.terrain.frequency}
          onChange={handleTerrainFrequencyChange}
        />

        <ColorField
          id="terrain-color"
          label="Color"
          value={activeSettings.terrain.color}
          onChange={handleTerrainColorChange}
        />
      </div>
    </CollapsibleSection>
  );
};
