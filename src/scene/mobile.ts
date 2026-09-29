/**
 * `true` when the primary input is a touch device (phone, tablet). Deliberately
 * independent of viewport width, so a phone in landscape is detected the same
 * as in portrait.
 */
export const isMobile = (): boolean => window.matchMedia('(pointer: coarse)').matches;
