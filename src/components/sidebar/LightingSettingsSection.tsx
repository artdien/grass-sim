import type { ChangeEvent } from 'react';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { ColorField } from '@/components/ColorField';
import { NumberField } from '@/components/NumberField';
import { useSimulationStore } from '@/store/simulation';

/** Parses a light direction component; null when it is not a finite number. */
const parseDirectionValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Parses the specular shininess; null when it is not an integer ≥ 1. */
const parseShininessValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
};

/** Parses the specular intensity; null when it is not a number ≥ 0. */
const parseIntensityValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

/** The Lighting settings section: hemispherical, diffuse (directional), and specular terms. */
export const LightingSettingsSection = () => {
  const activeSettings = useSimulationStore((state) => state.activeSettings);
  const updateActiveSettings = useSimulationStore((state) => state.updateActiveSettings);

  // Invalid input is not committed, so the field snaps back to its last valid value.
  const handleHemisphereColorChange = (
    field: 'skyColor' | 'groundColor',
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    updateActiveSettings({
      ...activeSettings,
      lighting: {
        ...activeSettings.lighting,
        hemisphere: { ...activeSettings.lighting.hemisphere, [field]: event.target.value },
      },
    });
  };

  const handleDiffuseColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateActiveSettings({
      ...activeSettings,
      lighting: {
        ...activeSettings.lighting,
        diffuse: { ...activeSettings.lighting.diffuse, color: event.target.value },
      },
    });
  };

  const handleDirectionChange = (
    component: 'x' | 'y' | 'z',
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const parsed = parseDirectionValue(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      lighting: {
        ...activeSettings.lighting,
        diffuse: {
          ...activeSettings.lighting.diffuse,
          direction: { ...activeSettings.lighting.diffuse.direction, [component]: parsed },
        },
      },
    });
  };

  const handleSpecularChange = (
    field: 'shininess' | 'intensity',
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const parsed =
      field === 'shininess'
        ? parseShininessValue(event.target.value)
        : parseIntensityValue(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      lighting: {
        ...activeSettings.lighting,
        specular: { ...activeSettings.lighting.specular, [field]: parsed },
      },
    });
  };

  return (
    <CollapsibleSection title="Lighting">
      <div className="space-y-3">
        <h3 className="pt-1 text-xs font-semibold tracking-wide text-stone-500">Hemisphere</h3>

        <ColorField
          id="lighting-sky-color"
          label="Sky color"
          value={activeSettings.lighting.hemisphere.skyColor}
          onChange={(event) => handleHemisphereColorChange('skyColor', event)}
        />

        <ColorField
          id="lighting-ground-color"
          label="Ground color"
          value={activeSettings.lighting.hemisphere.groundColor}
          onChange={(event) => handleHemisphereColorChange('groundColor', event)}
        />

        <h3 className="pt-1 text-xs font-semibold tracking-wide text-stone-500">Diffuse</h3>

        <ColorField
          id="lighting-light-color"
          label="Light color"
          value={activeSettings.lighting.diffuse.color}
          onChange={handleDiffuseColorChange}
        />

        <NumberField
          id="lighting-direction-x"
          label="Direction X"
          step={0.1}
          value={activeSettings.lighting.diffuse.direction.x}
          onChange={(event) => handleDirectionChange('x', event)}
        />

        <NumberField
          id="lighting-direction-y"
          label="Direction Y"
          step={0.1}
          value={activeSettings.lighting.diffuse.direction.y}
          onChange={(event) => handleDirectionChange('y', event)}
        />

        <NumberField
          id="lighting-direction-z"
          label="Direction Z"
          step={0.1}
          value={activeSettings.lighting.diffuse.direction.z}
          onChange={(event) => handleDirectionChange('z', event)}
        />

        <h3 className="pt-1 text-xs font-semibold tracking-wide text-stone-500">Blinn-Phong</h3>

        <NumberField
          id="lighting-shininess"
          label="Shininess"
          min={1}
          step={1}
          value={activeSettings.lighting.specular.shininess}
          onChange={(event) => handleSpecularChange('shininess', event)}
        />

        <NumberField
          id="lighting-intensity"
          label="Intensity"
          min={0}
          step={0.1}
          value={activeSettings.lighting.specular.intensity}
          onChange={(event) => handleSpecularChange('intensity', event)}
        />
      </div>
    </CollapsibleSection>
  );
};
