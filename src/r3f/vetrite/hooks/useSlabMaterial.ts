'use client';

import type * as THREE from 'three';
import useMaterialStore from '@/r3f/vetrite/stores/useMaterialStore';
import useMaterialService from '@/r3f/vetrite/stores/useMaterialService';

/**
 * useSlabMaterial
 * Returns the active finish material for the slab mesh.
 * Must be used inside a component that also calls useFinishTexture(),
 * which propagates the product texture to the material service.
 */
export default function useSlabMaterial(): THREE.Material | null {
  const activeFinish = useMaterialStore((state) => state.activeFinish);
  const getMaterial = useMaterialService((state) => state.get);

  const material = getMaterial(activeFinish);
  if (!material) {
    console.warn(
      `[useSlabMaterial] Material for finish "${activeFinish}" not yet instantiated`,
    );
  }
  return material ?? null;
}
