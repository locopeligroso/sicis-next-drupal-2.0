// ─── ANIMATION & INTERACTION ─────────────────────────────────────────────────
/** Slerp factor for smooth mouse-tracking rotation. 0 = instant, 1 = no movement. */
export const SLAB_SLERP_FACTOR = 0.06;
/** maath/easing smoothTime for mirror slide animation. Lower = faster. 1/6 ≈ 0.167s → ~0.7s visual settle. */
export const MIRROR_SMOOTH_TIME = 1 / 6;
/** Scales normalised mouse coords [-1,1] to rotation range in radians */
export const MOUSE_TRACK_SCALE = 2.0;
export const MOUSE_TRACK_Z_OFFSET = 3;
