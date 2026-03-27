'use client';

/**
 * useMaterialStore.ts
 * Zustand store — global 3D scene state.
 *
 * Manages: active finish, HDRI selection, tone mapping, output color space,
 * light intensities, OpalOff color tint, emissive presets, and mirror animation state.
 *
 * Finish IDs mirror sceneConfig constants so the 3D layer
 * can consume the same values without a separate adapter.
 *
 * setActiveFinish(id) : boolean — true on success, false if id is unknown
 */

import { create } from 'zustand';
import {
  DEFAULT_FINISH,
  DEFAULT_HDRI_ID,
  DEFAULT_HDRI_INTENSITY,
  DEFAULT_HDRI_ROTATION_Y,
  DEFAULT_TONE_MAPPING,
  DEFAULT_TONE_MAPPING_EXPOSURE,
  DEFAULT_OUTPUT_COLOR_SPACE,
  AMBIENT_INTENSITY,
  KEY_INTENSITY,
  FILL_INTENSITY,
  FINISH_CHROME,
  FINISH_IDS,
  FINISH_OPAL_OFF,
  FINISH_OPAL_ON,
  FINISH_SOLID,
  FINISH_HDRI_MAP,
  OPAL_BACKLIGHT_INTENSITY_OFF,
  OPAL_BACKLIGHT_INTENSITY_ON,
  OPAL_OFF_MATERIAL_PARAMS,
  OPAL_EMISSIVE_PRESETS,
  DEFAULT_OPAL_EMISSIVE_PRESET,
  CANVAS_BG_COLOR_DEFAULT,
  CANVAS_TRANSPARENT_DEFAULT,
} from '@/r3f/vetrite/config/sceneConfig';
import useMaterialService from './useMaterialService';
import type { FinishId, MaterialStoreState } from '@/r3f/vetrite/types';

export {
  DEFAULT_FINISH,
  FINISH_CHROME,
  FINISH_IDS,
  FINISH_OPAL_OFF,
  FINISH_OPAL_ON,
  FINISH_SOLID,
};

const getOpalBacklightBaseline = (finishId: FinishId): number =>
  finishId === FINISH_OPAL_ON
    ? OPAL_BACKLIGHT_INTENSITY_ON
    : OPAL_BACKLIGHT_INTENSITY_OFF;

// ─── Store ────────────────────────────────────────────────────────────────────
const useMaterialStore = create<MaterialStoreState>((set, get) => ({
  activeFinish: DEFAULT_FINISH,
  hdriId: DEFAULT_HDRI_ID,
  envIntensity: DEFAULT_HDRI_INTENSITY,
  envRotationY: DEFAULT_HDRI_ROTATION_Y,
  toneMapping: DEFAULT_TONE_MAPPING,
  outputColorSpace: DEFAULT_OUTPUT_COLOR_SPACE,
  toneMappingExposure: DEFAULT_TONE_MAPPING_EXPOSURE,
  ambientIntensity: AMBIENT_INTENSITY,
  keyIntensity: KEY_INTENSITY,
  fillIntensity: FILL_INTENSITY,
  opalBacklightIntensity: getOpalBacklightBaseline(DEFAULT_FINISH),

  // ─── OpalOff color tint ───────────────────────────────────────────────────
  // Stored as CSS hex string.
  // On change, propagated directly to the cached OpalOff material.
  opalOffColor:
    '#' + OPAL_OFF_MATERIAL_PARAMS.color.toString(16).padStart(6, '0'),

  // ─── Opal ON emissive color preset (Neutral / Warm / Cold) ──────────────
  opalEmissivePreset: DEFAULT_OPAL_EMISSIVE_PRESET,
  opalEmissiveColor:
    OPAL_EMISSIVE_PRESETS[DEFAULT_OPAL_EMISSIVE_PRESET] ?? '#ffffff',

  setActiveFinish: (id: FinishId): boolean => {
    if (!FINISH_IDS.includes(id)) {
      console.error(`[useMaterialStore] Unknown finish id: "${id}"`);
      return false;
    }
    if (get().activeFinish === id) return true;
    set({
      activeFinish: id,
      hdriId: FINISH_HDRI_MAP[id] ?? DEFAULT_HDRI_ID,
      opalBacklightIntensity: getOpalBacklightBaseline(id),
    });
    return true;
  },

  setHdriId: (id: string) => set({ hdriId: id }),
  setEnvIntensity: (value: number) => set({ envIntensity: value }),
  setEnvRotationY: (value: number) => set({ envRotationY: value }),
  setToneMapping: (value) => set({ toneMapping: value }),
  setOutputColorSpace: (value) => set({ outputColorSpace: value }),
  setToneMappingExposure: (value: number) =>
    set({ toneMappingExposure: value }),
  setAmbientIntensity: (value: number) => set({ ambientIntensity: value }),
  setKeyIntensity: (value: number) => set({ keyIntensity: value }),
  setFillIntensity: (value: number) => set({ fillIntensity: value }),
  setOpalBacklightIntensity: (value: number) =>
    set({ opalBacklightIntensity: value }),

  // OpalOff color setter — delegates material mutation to useMaterialService (SRP)
  setOpalOffColor: (hex: string) => {
    set({ opalOffColor: hex });
    useMaterialService.getState().setMaterialColor(FINISH_OPAL_OFF, hex);
  },

  // Opal emissive preset setter — updates preset key, resolved color, and material emissive
  setOpalEmissivePreset: (preset: string) => {
    const hex = OPAL_EMISSIVE_PRESETS[preset];
    if (!hex) {
      console.error(
        `[useMaterialStore] Unknown opal emissive preset: "${preset}"`,
      );
      return;
    }
    set({ opalEmissivePreset: preset, opalEmissiveColor: hex });
    useMaterialService.getState().setMaterialEmissive(FINISH_OPAL_ON, hex);
  },

  // ─── Canvas background ───────────────────────────────────────────────────
  canvasBgColor: CANVAS_BG_COLOR_DEFAULT,
  canvasTransparent: CANVAS_TRANSPARENT_DEFAULT,
  setCanvasBgColor: (hex: string) => set({ canvasBgColor: hex }),
  setCanvasTransparent: (value: boolean) => set({ canvasTransparent: value }),

  // ─── Mirror state ─────────────────────────────────────────────────────────
  isMirrored: false,
  toggleMirror: () => set((state) => ({ isMirrored: !state.isMirrored })),
}));

export default useMaterialStore;
