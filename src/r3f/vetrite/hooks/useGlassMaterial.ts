'use client';

import { useEffect } from 'react';
import type * as THREE from 'three';
import useMaterialService from '@/r3f/vetrite/stores/useMaterialService';
import useMaterialStore from '@/r3f/vetrite/stores/useMaterialStore';
import {
  FINISH_OPAL_OFF,
  GLASS_MATERIAL_PARAMS,
  GLASS_OPAL_OFF_OVERRIDES,
  MAT_GLASS,
} from '@/r3f/vetrite/config/sceneConfig';

// Keys to restore when leaving OpalOff — only the properties that GLASS_OPAL_OFF_OVERRIDES touches.
const GLASS_DEFAULT_KEYS = Object.keys(GLASS_OPAL_OFF_OVERRIDES) as Array<
  keyof typeof GLASS_OPAL_OFF_OVERRIDES
>;

/**
 * useGlassMaterial
 * Returns the Glass material and applies OpalOff overrides when that finish is active.
 * Only uniform-level properties are changed — no shader recompile needed.
 */
export default function useGlassMaterial(): THREE.Material | null {
  const getMaterial = useMaterialService((state) => state.get);
  const activeFinish = useMaterialStore((state) => state.activeFinish);
  const material = getMaterial(MAT_GLASS);

  // Mutate the cached glass material when entering/leaving OpalOff.
  useEffect(() => {
    if (!material) return;

    if (activeFinish === FINISH_OPAL_OFF) {
      // Apply reduced-reflection overrides
      for (const [key, value] of Object.entries(GLASS_OPAL_OFF_OVERRIDES)) {
        (material as unknown as Record<string, unknown>)[key] = value;
      }
    } else {
      // Restore defaults from GLASS_MATERIAL_PARAMS
      for (const key of GLASS_DEFAULT_KEYS) {
        (material as unknown as Record<string, unknown>)[key] =
          GLASS_MATERIAL_PARAMS[key as keyof typeof GLASS_MATERIAL_PARAMS];
      }
    }
    material.needsUpdate = true;
  }, [activeFinish, material]);

  if (!material) {
    console.warn('[useGlassMaterial] Glass material not yet instantiated');
  }
  return material ?? null;
}
