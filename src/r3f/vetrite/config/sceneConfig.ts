/**
 * sceneConfig.ts — Barrel re-export
 *
 * Single import point for all scene configuration.
 * Actual values live in the ./config/ modules, grouped by domain.
 *
 * Usage:
 *   import { CAMERA_FOV, SLAB_WIDTH, SOLID_MATERIAL_PARAMS } from '@/r3f/vetrite/config/sceneConfig'
 */

// ─── Camera ──────────────────────────────────────────────────────────────────
export {
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_FAR,
  CAMERA_POSITION,
  CAMERA_LOOK_AT,
} from './camera';

// ─── Renderer ────────────────────────────────────────────────────────────────
export {
  RENDERER_CLEAR_COLOR,
  RENDERER_MAX_PIXEL_RATIO,
  DEFAULT_TONE_MAPPING_EXPOSURE,
  DEFAULT_TONE_MAPPING,
  DEFAULT_OUTPUT_COLOR_SPACE,
  CANVAS_GL,
  SHADOW_MAP_TYPE,
  INITIAL_OUTPUT_COLOR_SPACE,
} from './renderer';

// ─── Environment (HDRI) ─────────────────────────────────────────────────────
export {
  HDRI_OPTIONS,
  DEFAULT_HDRI_ID,
  DEFAULT_HDRI_INTENSITY,
  DEFAULT_HDRI_ROTATION_Y,
  FINISH_HDRI_MAP,
  ENV_MAP_INTENSITY_DEFAULT,
  ENV_MAP_ROTATION_Y_DEFAULT,
} from './environment';

// ─── Lights ──────────────────────────────────────────────────────────────────
export {
  AMBIENT_COLOR,
  AMBIENT_INTENSITY,
  KEY_COLOR,
  KEY_INTENSITY,
  KEY_POSITION,
  KEY_SHADOW_MAP_SIZE,
  KEY_SHADOW_CAMERA,
  KEY_SHADOW_RADIUS,
  KEY_SHADOW_BIAS,
  FILL_COLOR,
  FILL_INTENSITY,
  FILL_POSITION,
  OPAL_BACKLIGHT_COLOR,
  OPAL_BACKLIGHT_DISTANCE,
  OPAL_BACKLIGHT_INTENSITY_OFF,
  OPAL_BACKLIGHT_INTENSITY_ON,
  OPAL_BACKLIGHT_POSITION,
  SHADOW_LIGHT_COLOR,
  SHADOW_LIGHT_INTENSITY,
  SHADOW_LIGHT_POSITION,
  SHADOW_LIGHT_MAP_SIZE,
  SHADOW_LIGHT_BIAS,
  SHADOW_LIGHT_CAMERA,
  SHADOW_LIGHT_RADIUS,
  SHADOW_LIGHT_BLUR_SAMPLES,
} from './lights';

// ─── Geometry ────────────────────────────────────────────────────────────────
export {
  SLAB_WIDTH,
  SLAB_ASPECT_RATIO,
  SLAB_HEIGHT,
  GLASS_DEPTH,
  SLAB_ROTATION_Y,
  SHADOW_PLANE_SIZE,
  SHADOW_PLANE_OPACITY,
  SHADOW_PLANE_Y,
  SHADOW_PLANE_ROTATION_X,
} from './geometry';

// ─── Animation & Interaction ─────────────────────────────────────────────────
export {
  SLAB_SLERP_FACTOR,
  MIRROR_SMOOTH_TIME,
  MOUSE_TRACK_SCALE,
  MOUSE_TRACK_Z_OFFSET,
} from './animation';

// ─── Materials ───────────────────────────────────────────────────────────────
export {
  FINISH_SOLID,
  FINISH_CHROME,
  FINISH_OPAL_OFF,
  FINISH_OPAL_ON,
  FINISH_IDS,
  MAT_GLASS,
  DEFAULT_FINISH,
  DEFAULT_FINISH_ID,
  SOLID_MATERIAL_PARAMS,
  CHROME_MATERIAL_PARAMS,
  GLASS_MATERIAL_PARAMS,
  OPAL_OFF_MATERIAL_PARAMS,
  OPAL_ON_MATERIAL_PARAMS,
  GLASS_OPAL_OFF_OVERRIDES,
  MAT_FALLBACK_COLOR,
  OPAL_EMISSIVE_PRESETS,
  DEFAULT_OPAL_EMISSIVE_PRESET,
} from './materials';

// ─── UI Defaults ──────────────────────────────────────────────────────────
export const CANVAS_BG_COLOR_DEFAULT = '#1d1d1d';
export const CANVAS_TRANSPARENT_DEFAULT = true;
