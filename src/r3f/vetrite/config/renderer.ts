import {
  ACESFilmicToneMapping,
  LinearSRGBColorSpace,
  SRGBColorSpace,
  VSMShadowMap,
} from 'three';

// ─── RENDERER ────────────────────────────────────────────────────────────────
export const RENDERER_CLEAR_COLOR = 0x000000; // alpha=0 → colour irrelevant (canvas transparent)
export const RENDERER_MAX_PIXEL_RATIO = 1.5; // Capped at 1.5 to halve GPU fill rate on Retina/5K displays
export const DEFAULT_TONE_MAPPING_EXPOSURE = 1.35;

/** Default tone mapping algorithm applied on renderer init */
export const DEFAULT_TONE_MAPPING = ACESFilmicToneMapping;
/** Default output color space applied on renderer init */
export const DEFAULT_OUTPUT_COLOR_SPACE = LinearSRGBColorSpace;

// ─── CANVAS GL OPTIONS ──────────────────────────────────────────────────────
// alpha: true — supports both opaque and transparent modes at runtime
export const CANVAS_GL: { antialias: boolean; alpha: boolean } = {
  antialias: true,
  alpha: true,
};

/** Shadow map algorithm used by the Canvas */
export const SHADOW_MAP_TYPE = VSMShadowMap;

/** Output color space set once as safe default before RendererSync takes over */
export const INITIAL_OUTPUT_COLOR_SPACE = SRGBColorSpace;
