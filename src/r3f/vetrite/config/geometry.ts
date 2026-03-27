// ─── SLAB ────────────────────────────────────────────────────────────────────
export const SLAB_WIDTH = 1.2;
export const SLAB_ASPECT_RATIO = 2.33; // height/width ratio — 1:2.33
export const SLAB_HEIGHT = SLAB_WIDTH * SLAB_ASPECT_RATIO;
export const GLASS_DEPTH = 0.0125; // Halved from 0.025 to reduce visible refraction artifacts
export const SLAB_ROTATION_Y = 0;

// ─── SHADOW PLANE ────────────────────────────────────────────────────────────
export const SHADOW_PLANE_SIZE = 20;
export const SHADOW_PLANE_OPACITY = 0.15;
export const SHADOW_PLANE_Y = -1.8;
/** Rotation (radians) to lay the plane flat — -90° around X axis */
export const SHADOW_PLANE_ROTATION_X = -Math.PI / 2;
