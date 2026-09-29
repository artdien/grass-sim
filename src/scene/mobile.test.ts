import { afterEach, describe, expect, it, vi } from 'vitest';

import { isMobile } from '@/scene/mobile';

// jsdom has no matchMedia; report the coarse-pointer result the test cares about.
const stubMatchMedia = (matches: boolean) => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

// These tests look trivial on purpose: they pin the detection contract
// (mobile = coarse pointer, and nothing else), which no other test covers.
describe('isMobile', () => {
  it('returns true when the coarse-pointer query matches', () => {
    stubMatchMedia(true);

    expect(isMobile()).toBe(true);
  });

  it('returns false when the coarse-pointer query does not match', () => {
    stubMatchMedia(false);

    expect(isMobile()).toBe(false);
  });
});
