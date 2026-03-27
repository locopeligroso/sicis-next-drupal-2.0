import type { FinishId } from '@/r3f/vetrite/types';

// ─── HDRI ────────────────────────────────────────────────────────────────────
// Only the default RR HDRI is supported. All HDRI paths reference this location.
// RR: VR apartment loft interior baked, high-res — warm domestic ambient, universal default.
export const HDRI_OPTIONS: Record<string, string> = {
  RR: '/assets/hdri/vetrite/RR.hdr',
};

export const DEFAULT_HDRI_ID = 'RR';
export const DEFAULT_HDRI_INTENSITY = 3.0;
export const DEFAULT_HDRI_ROTATION_Y = -0.7;

// ─── FINISH → HDRI mapping ────────────────────────────────────────────────────
// All finishes use the same RR HDRI.
export const FINISH_HDRI_MAP: Record<FinishId, string> = {
  Solid: 'RR',
  Chrome: 'RR',
  OpalOff: 'RR',
  OpalOn: 'RR',
};

// ─── ENVIRONMENT DEFAULTS ─────────────────────────────────────────────────────
/** Default environment map intensity used by MaterialService before first update */
export const ENV_MAP_INTENSITY_DEFAULT = 1;
/** Default environment map Y-rotation (radians) used by MaterialService before first update */
export const ENV_MAP_ROTATION_Y_DEFAULT = 0;
