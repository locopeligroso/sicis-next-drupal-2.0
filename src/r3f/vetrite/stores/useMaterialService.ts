'use client';

/**
 * useMaterialService.ts
 * Zustand store — replaces the module-level MaterialService singleton.
 * Fixes double-instantiation under React StrictMode.
 *
 * Public API:
 *   get(id)                          → material instance (lazy-created)
 *   setEnvMap(envMap)                → propagate env texture to all cached materials
 *   setEnvMapIntensity(intensity)    → propagate env intensity to all cached materials
 *   setEnvMapRotationY(rotationY)    → propagate env Y-rotation to all cached materials
 *   setFinishMap(texture)            → propagate diffuse map to selectable finish materials
 *   dispose(id)                      → dispose + remove single material
 *   disposeAll()                     → dispose + clear all cached materials
 *
 * Usage inside React:
 *   const getMaterial = useMaterialService((s) => s.get)
 *   const mat = getMaterial('Solid')
 *
 * Usage outside React (cleanup):
 *   useMaterialService.getState().disposeAll()
 */

import { create } from 'zustand';
import * as THREE from 'three';
import MaterialFactory from '@/r3f/vetrite/materials/MaterialFactory';
import {
  ENV_MAP_INTENSITY_DEFAULT,
  ENV_MAP_ROTATION_Y_DEFAULT,
  FINISH_IDS,
} from '@/r3f/vetrite/config/sceneConfig';
import type { MaterialServiceState } from '@/r3f/vetrite/types';

const SELECTABLE_FINISH_IDS = new Set<string>(FINISH_IDS);

// ─── helpers (pure functions, no store access) ────────────────────────────────

function applyEnvMap(mat: THREE.Material, envMap: THREE.Texture | null): void {
  if (!('envMap' in mat)) return;
  (mat as THREE.MeshStandardMaterial).envMap = envMap;
  mat.needsUpdate = true;
}

function applyEnvInfluence(
  mat: THREE.Material,
  intensity: number,
  rotationY: number,
): void {
  const std = mat as THREE.MeshStandardMaterial;
  if ('envMapIntensity' in mat && typeof std.envMapIntensity === 'number') {
    std.envMapIntensity = intensity;
  }
  if (
    'envMapRotation' in mat &&
    std.envMapRotation &&
    typeof std.envMapRotation.set === 'function'
  ) {
    std.envMapRotation.set(0, rotationY, 0);
  }
  mat.needsUpdate = true;
}

// ─── store ────────────────────────────────────────────────────────────────────

const useMaterialService = create<MaterialServiceState>((set, get) => ({
  materials: {},
  _envMap: null,
  _finishMap: null,
  _envMapIntensity: ENV_MAP_INTENSITY_DEFAULT,
  _envMapRotationY: ENV_MAP_ROTATION_Y_DEFAULT,

  /**
   * Get (or lazy-create) a material by ID.
   * Applies current envMap, envInfluence and finishMap on first creation.
   */
  get: (id: string): THREE.Material => {
    const state = get();
    if (state.materials[id]) return state.materials[id];

    const mat = MaterialFactory.create(id, { finishMap: state._finishMap });
    applyEnvMap(mat, state._envMap);
    applyEnvInfluence(mat, state._envMapIntensity, state._envMapRotationY);
    if (
      typeof (mat as { setEmissiveMap?: unknown }).setEmissiveMap ===
        'function' &&
      state._finishMap
    ) {
      (
        mat as unknown as { setEmissiveMap: (t: THREE.Texture) => void }
      ).setEmissiveMap(state._finishMap);
    }

    set((prev) => ({ materials: { ...prev.materials, [id]: mat } }));
    return mat;
  },

  /**
   * Set the scene environment map and propagate to all cached materials.
   */
  setEnvMap: (envMap: THREE.Texture | null): void => {
    const { materials, _envMapIntensity, _envMapRotationY } = get();
    for (const [id, mat] of Object.entries(materials)) {
      try {
        applyEnvMap(mat, envMap);
        applyEnvInfluence(mat, _envMapIntensity, _envMapRotationY);
      } catch (err) {
        console.error(
          `[useMaterialService] setEnvMap failed for material "${id}":`,
          err,
        );
      }
    }
    set({ _envMap: envMap });
  },

  /**
   * Set environment intensity and propagate to cached materials.
   */
  setEnvMapIntensity: (intensity: number): void => {
    const { materials, _envMapRotationY } = get();
    for (const [id, mat] of Object.entries(materials)) {
      try {
        applyEnvInfluence(mat, intensity, _envMapRotationY);
      } catch (err) {
        console.error(
          `[useMaterialService] setEnvMapIntensity failed for material "${id}":`,
          err,
        );
      }
    }
    set({ _envMapIntensity: intensity });
  },

  /**
   * Set environment Y rotation and propagate to cached materials.
   */
  setEnvMapRotationY: (rotationY: number): void => {
    const { materials, _envMapIntensity } = get();
    for (const [id, mat] of Object.entries(materials)) {
      try {
        applyEnvInfluence(mat, _envMapIntensity, rotationY);
      } catch (err) {
        console.error(
          `[useMaterialService] setEnvMapRotationY failed for material "${id}":`,
          err,
        );
      }
    }
    set({ _envMapRotationY: rotationY });
  },

  /**
   * Set the shared diffuse map for selectable finishes.
   */
  setFinishMap: (texture: THREE.Texture | null): void => {
    const { materials } = get();
    for (const [id, mat] of Object.entries(materials)) {
      if (!SELECTABLE_FINISH_IDS.has(id)) continue;
      try {
        (mat as THREE.MeshStandardMaterial).map = texture;
        if (
          typeof (mat as { setEmissiveMap?: unknown }).setEmissiveMap ===
            'function' &&
          texture
        ) {
          (
            mat as unknown as { setEmissiveMap: (t: THREE.Texture) => void }
          ).setEmissiveMap(texture);
        }
        mat.needsUpdate = true;
      } catch (err) {
        console.error(
          `[useMaterialService] setFinishMap failed for material "${id}":`,
          err,
        );
      }
    }
    set({ _finishMap: texture });
  },

  /**
   * Dispose a single material and remove from cache.
   */
  dispose: (id: string): void => {
    const { materials } = get();
    if (!materials[id]) return;
    materials[id].dispose();
    set((prev) => {
      const next = { ...prev.materials };
      delete next[id];
      return { materials: next };
    });
  },

  /**
   * Dispose all cached materials and clear the registry.
   */
  disposeAll: (): void => {
    const { materials } = get();
    for (const mat of Object.values(materials)) mat.dispose();
    set({
      materials: {},
      _envMap: null,
      _finishMap: null,
      _envMapIntensity: ENV_MAP_INTENSITY_DEFAULT,
      _envMapRotationY: ENV_MAP_ROTATION_Y_DEFAULT,
    });
  },

  /**
   * Set the color of a cached material by ID.
   * No-op if the material has not been instantiated yet.
   */
  setMaterialColor: (id: string, hex: string): void => {
    const mat = get().materials[id];
    if (!mat) {
      console.warn(
        `[useMaterialService] setMaterialColor: material "${id}" not yet instantiated`,
      );
      return;
    }
    (mat as THREE.MeshStandardMaterial).color.set(hex);
    mat.needsUpdate = true;
  },

  /**
   * Set the emissive color of a cached material by ID.
   * No-op if the material has not been instantiated yet or has no emissive property.
   */
  setMaterialEmissive: (id: string, hex: string): void => {
    const mat = get().materials[id];
    if (!mat) {
      console.warn(
        `[useMaterialService] setMaterialEmissive: material "${id}" not yet instantiated`,
      );
      return;
    }
    if ('emissive' in mat) {
      (mat as THREE.MeshStandardMaterial).emissive.set(hex);
      mat.needsUpdate = true;
    }
  },
}));

export default useMaterialService;
