import type { ChangeEvent } from 'react';
import { CollapsibleSection } from '@/components/layout/CollapsibleSection';
import { ColorPairField } from '@/components/fields/ColorPairField';
import { SliderField } from '@/components/fields/SliderField';
import { useSimulationStore } from '@/store/simulation';

/** Parses the blade width; null when it is not a number in (0, 1]. */
const parseBladeWidthValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : null;
};

/** Parses the blade height; null when it is not a number in (0, 5]. */
const parseBladeHeightValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 5 ? parsed : null;
};

/** Parses the blade bending; null when it is not a number of degrees in [0, 45]. */
const parseBladeBendingValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 45 ? parsed : null;
};

/** Parses a [0, 1] variation amount; null when it is not a number in [0, 1]. */
const parseUnitRangeValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : null;
};

/** Parses the shadowing; null when it is not a number in [0, 10]. */
const parseShadowingValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10 ? parsed : null;
};

/** Parses the softness; null when it is not a number in [0, 3]. */
const parseSoftnessValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 3 ? parsed : null;
};

/** The Grass settings section: blade shape and variation, color palettes, and shading (shadowing, half-lambertian softness). Bending is in degrees; the scene converts it to radians for the shader. */
export const GrassSettingsSection = () => {
  const activeSettings = useSimulationStore((state) => state.activeSettings);
  const updateActiveSettings = useSimulationStore((state) => state.updateActiveSettings);

  // Invalid input is not committed, so the field snaps back to its last valid value.
  const handleBladeWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseBladeWidthValue(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      grass: { ...activeSettings.grass, bladeWidth: parsed },
    });
  };

  const handleBladeHeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseBladeHeightValue(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      grass: { ...activeSettings.grass, bladeHeight: parsed },
    });
  };

  const handleBladeBendingChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseBladeBendingValue(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      grass: { ...activeSettings.grass, bladeBending: parsed },
    });
  };

  const handleVariationChange = (
    field: 'bladeHeightRandomness' | 'colorMix' | 'colorDistribution',
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const parsed = parseUnitRangeValue(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      grass: { ...activeSettings.grass, [field]: parsed },
    });
  };

  const handleColorChange = (
    field: 'baseColor1' | 'tipColor1' | 'baseColor2' | 'tipColor2',
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    updateActiveSettings({
      ...activeSettings,
      grass: { ...activeSettings.grass, [field]: event.target.value },
    });
  };

  const handleShadowingChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseShadowingValue(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      grass: { ...activeSettings.grass, shadowing: parsed },
    });
  };

  const handleThickeningChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseUnitRangeValue(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      grass: { ...activeSettings.grass, bladeThickening: parsed },
    });
  };

  const handleSoftnessChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseSoftnessValue(event.target.value);
    if (parsed === null) {
      return;
    }
    updateActiveSettings({
      ...activeSettings,
      grass: { ...activeSettings.grass, softness: parsed },
    });
  };

  return (
    <CollapsibleSection title="Grass">
      <div className="space-y-3">
        <h3 className="pt-1 text-xs font-semibold tracking-wide text-stone-500">Blade</h3>

        <SliderField
          id="grass-blade-width"
          label="Width"
          help="How wide the blade is."
          min={0}
          max={1}
          step={0.01}
          value={activeSettings.grass.bladeWidth}
          onChange={handleBladeWidthChange}
        />

        <SliderField
          id="grass-blade-height"
          label="Height"
          help="How tall the blade is."
          min={0}
          max={5}
          step={0.05}
          value={activeSettings.grass.bladeHeight}
          onChange={handleBladeHeightChange}
        />

        <SliderField
          id="grass-blade-bending"
          label="Bending"
          help="The blade's resting bend angle."
          min={0}
          max={45}
          step={1}
          value={activeSettings.grass.bladeBending}
          onChange={handleBladeBendingChange}
        />

        <SliderField
          id="grass-height-randomness"
          label="Randomness"
          help="How much the blade height varies between blades."
          min={0}
          max={1}
          step={0.05}
          value={activeSettings.grass.bladeHeightRandomness}
          onChange={(event) => handleVariationChange('bladeHeightRandomness', event)}
        />

        <SliderField
          id="grass-thickening"
          label="Thickening"
          help="How strongly the blade widens in view space as it turns edge-on."
          min={0}
          max={1}
          step={0.05}
          value={activeSettings.grass.bladeThickening}
          onChange={handleThickeningChange}
        />

        <h3 className="pt-1 text-xs font-semibold tracking-wide text-stone-500">Color</h3>

        <SliderField
          id="grass-color-distribution"
          label="Distribution"
          help="Spatial scale of the color-field variation."
          min={0}
          max={1}
          step={0.05}
          value={activeSettings.grass.colorDistribution}
          onChange={(event) => handleVariationChange('colorDistribution', event)}
        />

        <SliderField
          id="grass-color-mix"
          label="Mix"
          help="How strongly the two color palettes blend."
          min={0}
          max={1}
          step={0.05}
          value={activeSettings.grass.colorMix}
          onChange={(event) => handleVariationChange('colorMix', event)}
        />

        <ColorPairField
          id="grass-color-1"
          label="Palette 1"
          help="First blade color palette: base (ground) and tip color."
          baseValue={activeSettings.grass.baseColor1}
          tipValue={activeSettings.grass.tipColor1}
          onBaseChange={(event) => handleColorChange('baseColor1', event)}
          onTipChange={(event) => handleColorChange('tipColor1', event)}
        />

        <ColorPairField
          id="grass-color-2"
          label="Palette 2"
          help="Second blade color palette: base (ground) and tip color."
          baseValue={activeSettings.grass.baseColor2}
          tipValue={activeSettings.grass.tipColor2}
          onBaseChange={(event) => handleColorChange('baseColor2', event)}
          onTipChange={(event) => handleColorChange('tipColor2', event)}
        />

        <h3 className="pt-1 text-xs font-semibold tracking-wide text-stone-500">Shading</h3>

        <SliderField
          id="grass-shadowing"
          label="Shadowing"
          help="Exponent of the blade's shadowing toward its base."
          min={0}
          max={10}
          step={0.1}
          value={activeSettings.grass.shadowing}
          onChange={handleShadowingChange}
        />

        <SliderField
          id="grass-softness"
          label="Softness"
          help="Exponent of the blade's half-lambertian diffuse wrap."
          min={0}
          max={3}
          step={0.1}
          value={activeSettings.grass.softness}
          onChange={handleSoftnessChange}
        />
      </div>
    </CollapsibleSection>
  );
};
