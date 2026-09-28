import type { ChangeEvent } from 'react';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { ColorField } from '@/components/ColorField';
import { NumberField } from '@/components/NumberField';
import type { TerrainNoiseType } from '@/types';
import { useSimulationStore } from '@/store/simulation';

/** Noise fields the terrain section can select, matched to the shader's uNoiseType index. */
const NOISE_OPTIONS: { value: TerrainNoiseType; label: string }[] = [
  { value: 'perlin', label: 'Perlin' },
  { value: 'simplex', label: 'Simplex' },
];

/** Above this the terrain grid quadruples and the scene chokes. */
const MAX_TERRAIN_SEGMENTS = 1024;

/** Parses a terrain field input; null when it is not an integer ≥ 1. */
const parseTerrainValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
};

/** Parses a terrain float (height amplitude / noise frequency); null when not a number ≥ 0. */
const parseTerrainFloat = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

/** The Terrain settings section: size, segments, noise type, height, frequency, and base color. */
export const TerrainSettingsSection = () => {
  const activeSettings = useSimulationStore((state) => state.activeSettings);
  const updateActiveSettings = useSimulationStore((state) => state.updateActiveSettings);

  // Invalid input is not committed, so the field snaps back to its last valid value.
  const handleTerrainChange = (
    field: 'size' | 'segments',
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const parsed = parseTerrainValue(event.target.value);
    if (parsed === null) {
      return;
    }
    const value = field === 'segments' ? Math.min(parsed, MAX_TERRAIN_SEGMENTS) : parsed;
    updateActiveSettings({
      ...activeSettings,
      terrain: { ...activeSettings.terrain, [field]: value },
    });
  };

  const handleTerrainFloatChange = (
    field: 'height' | 'frequency',
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const parsed = parseTerrainFloat(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      terrain: { ...activeSettings.terrain, [field]: parsed },
    });
  };

  const handleTerrainColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateActiveSettings({
      ...activeSettings,
      terrain: { ...activeSettings.terrain, color: event.target.value },
    });
  };

  const handleNoiseTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateActiveSettings({
      ...activeSettings,
      terrain: { ...activeSettings.terrain, noiseType: event.target.value as TerrainNoiseType },
    });
  };

  return (
    <CollapsibleSection title="Terrain">
      <div className="space-y-3">
        <NumberField
          id="terrain-size"
          label="Size"
          min={1}
          step={1}
          value={activeSettings.terrain.size}
          onChange={(event) => handleTerrainChange('size', event)}
        />

        <NumberField
          id="terrain-segments"
          label="Segments"
          min={1}
          max={MAX_TERRAIN_SEGMENTS}
          step={1}
          value={activeSettings.terrain.segments}
          onChange={(event) => handleTerrainChange('segments', event)}
        />

        <label
          htmlFor="terrain-noise"
          className="flex items-center justify-between gap-2 text-sm text-stone-600"
        >
          Noise
          <select
            id="terrain-noise"
            value={activeSettings.terrain.noiseType}
            onChange={handleNoiseTypeChange}
            className="w-24 cursor-pointer rounded-md border border-stone-200 bg-white px-2 py-1 text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {NOISE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <NumberField
          id="terrain-height"
          label="Height"
          min={0}
          step={0.05}
          value={activeSettings.terrain.height}
          onChange={(event) => handleTerrainFloatChange('height', event)}
        />

        <NumberField
          id="terrain-frequency"
          label="Frequency"
          min={0}
          step={0.05}
          value={activeSettings.terrain.frequency}
          onChange={(event) => handleTerrainFloatChange('frequency', event)}
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
