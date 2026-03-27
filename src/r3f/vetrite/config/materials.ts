import type {
  FinishId,
  SolidMaterialParams,
  ChromeMaterialParams,
  GlassMaterialParams,
  OpalOffMaterialParams,
  OpalOnMaterialParams,
  GlassOpalOffOverrides,
} from '@/r3f/vetrite/types';

// ─── FINISH IDS ───────────────────────────────────────────────────────────────
export const FINISH_SOLID = 'Solid' as const;
export const FINISH_CHROME = 'Chrome' as const;
export const FINISH_OPAL_OFF = 'OpalOff' as const;
export const FINISH_OPAL_ON = 'OpalOn' as const;
export const FINISH_IDS: FinishId[] = [
  FINISH_SOLID,
  FINISH_CHROME,
  FINISH_OPAL_OFF,
  FINISH_OPAL_ON,
];
export const MAT_GLASS = 'Glass' as const;
export const DEFAULT_FINISH: FinishId = FINISH_SOLID;
export const DEFAULT_FINISH_ID: FinishId = FINISH_SOLID;

// ─── MATERIAL PARAMS ─────────────────────────────────────────────────────────
// SOLID — laminated glass with coloured polymer layer; external surface smooth and glossy.
// Photographic texture (from textureUrl) applied as map/emissiveMap by MaterialService.
export const SOLID_MATERIAL_PARAMS: SolidMaterialParams = {
  color: 0xffffff,
  roughness: 0.1,
  metalness: 0.0,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  specularIntensity: 1.0,
  reflectivity: 0.1,
};

// CHROME — metallic laminated layer in glass, near-pure specular reflection.
// Uses MeshStandardMaterial (not Physical) — no clearcoat/transmission/IOR needed.
export const CHROME_MATERIAL_PARAMS: ChromeMaterialParams = {
  color: 0xffffff,
  roughness: 0.02,
  metalness: 1.0,
  envMapIntensity: 1.8,
};

// GLASS — transparent float glass panels wrapping the slab (front and back).
// IOR 1.5 = real float glass. Smooth clearcoat. No emission.
export const GLASS_MATERIAL_PARAMS: GlassMaterialParams = {
  color: 0xffffff,
  roughness: 0.0,
  metalness: 0.0,
  transmission: 1.0,
  thickness: 0.03,
  ior: 1.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0.0,
  specularIntensity: 0.5,
  reflectivity: 0.01,
  transparent: true,
  opacity: 1.0,
};

// OPAL OFF — opalescent layer without backlighting: milky/pearlescent appearance.
export const OPAL_OFF_MATERIAL_PARAMS: OpalOffMaterialParams = {
  color: 0xfffaef,
  roughness: 0.35,
  metalness: 0.0,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  specularIntensity: 1.0,
  reflectivity: 0.5,
  emissiveIntensity: 0,
};

// OPAL ON — Apollo Full Treatment: active backlighting with maximum luminosity and opalescence.
export const OPAL_ON_MATERIAL_PARAMS: OpalOnMaterialParams = {
  color: 0xffffff,
  roughness: 0.1,
  metalness: 0.0,
  emissive: 0xffffff,
  emissiveIntensity: 3,
  clearcoat: 0.5,
  clearcoatRoughness: 0.08,
  specularIntensity: 0,
  reflectivity: 0.1,
  sheen: 0.25,
  sheenColor: 0xc8d8ff,
  sheenRoughness: 0.3,
};

// ─── GLASS OVERRIDES PER FINISH ──────────────────────────────────────────────
// When OpalOff is active the glass sandwich should almost vanish.
export const GLASS_OPAL_OFF_OVERRIDES: GlassOpalOffOverrides = {
  specularIntensity: 0.05,
  reflectivity: 0.0,
  clearcoat: 0.1,
  clearcoatRoughness: 0.3,
};

/** Fallback material color used by MaterialFactory for unknown IDs (hot-pink for visibility) */
export const MAT_FALLBACK_COLOR = 0xff00ff;

/** Opal ON emissive color presets — label → CSS hex string. */
export const OPAL_EMISSIVE_PRESETS: Record<string, string> = {
  Neutral: '#ffffff',
  Warm: '#ffb347',
  Cold: '#a8d8ff',
};
export const DEFAULT_OPAL_EMISSIVE_PRESET = 'Warm';
