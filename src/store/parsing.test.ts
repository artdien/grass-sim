import type { StoredSimulationSettings } from '@/types';
import { describe, expect, it } from 'vitest';

import { parseSimulationSettings } from '@/store/parsing';
import { useSimulationStore } from '@/store/simulation';

// A well-formed imported-file document, deep-cloned from the store's defaults so
// each test can mutate one field to drive a single error path without touching
// the shared snapshot (and without spelling out the whole object every time).
const buildValidDocument = (): StoredSimulationSettings =>
  JSON.parse(
    JSON.stringify({
      name: '  My meadow  ',
      image: 'aW1hZ2U',
      settings: useSimulationStore.getState().activeSettings,
    }),
  ) as StoredSimulationSettings;

describe('parseSimulationSettings', () => {
  it('resolves a well-formed document, with the name trimmed and the settings round-tripped', () => {
    const result = parseSimulationSettings(JSON.stringify(buildValidDocument()));
    const activeSettings = useSimulationStore.getState().activeSettings;

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.data.name).toBe('My meadow');
    expect(result.data.image).toBe('aW1hZ2U');
    expect(result.data.settings).toEqual(activeSettings);
  });

  it('refuses a document that is not valid JSON', () => {
    expect(parseSimulationSettings('{ this is not json')).toEqual({
      ok: false,
      error: 'The selected file is not valid JSON.',
    });
  });

  it('refuses a document whose root is not an object', () => {
    expect(parseSimulationSettings('123')).toEqual({
      ok: false,
      error: 'The selected file does not contain simulation settings.',
    });
  });

  it('refuses a blank name', () => {
    const document = buildValidDocument();
    document.name = '   ';

    expect(parseSimulationSettings(JSON.stringify(document))).toEqual({
      ok: false,
      error: 'The settings are missing a valid name.',
    });
  });

  it('refuses a missing image', () => {
    const document = buildValidDocument();
    document.image = '';

    expect(parseSimulationSettings(JSON.stringify(document))).toEqual({
      ok: false,
      error: 'The settings are missing a render screenshot.',
    });
  });

  it('refuses a document with no settings', () => {
    const document = buildValidDocument();
    delete (document as { settings?: unknown }).settings;

    expect(parseSimulationSettings(JSON.stringify(document))).toEqual({
      ok: false,
      error: 'The simulation settings are missing their values.',
    });
  });

  it('refuses a wind velocity outside [0, 1]', () => {
    const document = buildValidDocument();
    document.settings.wind.velocity = -0.1;

    expect(parseSimulationSettings(JSON.stringify(document))).toEqual({
      ok: false,
      error: 'The wind velocity is missing or invalid.',
    });
  });

  it('refuses a blade softness outside [0, 3]', () => {
    const document = buildValidDocument();
    document.settings.grass.softness = -1;

    expect(parseSimulationSettings(JSON.stringify(document))).toEqual({
      ok: false,
      error: 'The blade softness is missing or invalid.',
    });
  });

  it('refuses a non-hex terrain color', () => {
    const document = buildValidDocument();
    document.settings.terrain.color = 'red';

    expect(parseSimulationSettings(JSON.stringify(document))).toEqual({
      ok: false,
      error: 'The terrain color is missing or invalid.',
    });
  });

  it('refuses a non-integer specular shininess', () => {
    const document = buildValidDocument();
    document.settings.lighting.specular.shininess = 0.5;

    expect(parseSimulationSettings(JSON.stringify(document))).toEqual({
      ok: false,
      error: 'The specular shininess is missing or invalid.',
    });
  });
});
