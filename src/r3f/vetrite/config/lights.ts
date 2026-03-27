// ─── LIGHTS ──────────────────────────────────────────────────────────────────
export const AMBIENT_COLOR = 0xffffff;
export const AMBIENT_INTENSITY = 0.3;

export const KEY_COLOR = 0xffffff;
export const KEY_INTENSITY = 1.4;
export const KEY_POSITION: [number, number, number] = [3, 5, 4];
export const KEY_SHADOW_MAP_SIZE = 512;
export const KEY_SHADOW_CAMERA = {
  left: -8,
  right: 8,
  top: 8,
  bottom: -8,
  near: 0.5,
  far: 30,
};
export const KEY_SHADOW_RADIUS = 8;
export const KEY_SHADOW_BIAS = -0.005;

export const FILL_COLOR = 0xffffff;
export const FILL_INTENSITY = 0.4;
export const FILL_POSITION: [number, number, number] = [-3, 3, 2];

export const OPAL_BACKLIGHT_COLOR = 0xffeedd;
export const OPAL_BACKLIGHT_DISTANCE = 3;
export const OPAL_BACKLIGHT_INTENSITY_OFF = 0;
export const OPAL_BACKLIGHT_INTENSITY_ON = 4.0;
export const OPAL_BACKLIGHT_POSITION: [number, number, number] = [0, 0, -1];

// ─── SHADOW LIGHT ─────────────────────────────────────────────────────────────
// Dedicated shadow light — nearly vertical so specular reflections point away from camera.
export const SHADOW_LIGHT_COLOR = 0xffffff;
export const SHADOW_LIGHT_INTENSITY = 0.5;
export const SHADOW_LIGHT_POSITION: [number, number, number] = [0, 8, 4];
export const SHADOW_LIGHT_MAP_SIZE = 2048;
export const SHADOW_LIGHT_BIAS = -0.003;
export const SHADOW_LIGHT_CAMERA = {
  left: -3,
  right: 3,
  top: 5,
  bottom: -5,
  near: 1,
  far: 20,
};
export const SHADOW_LIGHT_RADIUS = 10;
export const SHADOW_LIGHT_BLUR_SAMPLES = 16;
