/**
 * MaterialFactory.ts
 * Creates finish material instances by ID string.
 * Follows the Factory pattern from the threejs-materials skill.
 */

import * as THREE from 'three';
import GlassMaterial from './GlassMaterial';
import SolidMaterial from './SolidMaterial';
import ChromeMaterial from './ChromeMaterial';
import OpalMaterial from './OpalMaterial';
import {
  FINISH_CHROME,
  FINISH_OPAL_OFF,
  FINISH_OPAL_ON,
  FINISH_SOLID,
  MAT_GLASS,
  MAT_FALLBACK_COLOR,
} from '@/r3f/vetrite/config/sceneConfig';
import type { MaterialFactoryOptions } from '@/r3f/vetrite/types';

class MaterialFactory {
  /**
   * Create a material instance by ID.
   * @param id - One of the FINISH_* or MAT_* constants
   * @param options - Optional creation options (finishMap)
   */
  static create(
    id: string,
    options: MaterialFactoryOptions = {},
  ): THREE.Material {
    const { finishMap = null } = options;

    const applyFinishMap = (material: THREE.Material): THREE.Material => {
      // Skip glass material — transparent glass doesn't use a diffuse finish map
      if (id === MAT_GLASS) return material;
      if (finishMap && 'map' in material) {
        (material as THREE.MeshStandardMaterial).map = finishMap;
        material.needsUpdate = true;
      }
      return material;
    };

    switch (id) {
      case FINISH_SOLID:
        return applyFinishMap(new SolidMaterial());
      case FINISH_CHROME:
        return applyFinishMap(new ChromeMaterial());
      case FINISH_OPAL_OFF:
        return applyFinishMap(new OpalMaterial('off'));
      case FINISH_OPAL_ON:
        return applyFinishMap(new OpalMaterial('on'));
      case MAT_GLASS:
        return new GlassMaterial();
      default:
        console.warn(
          `[MaterialFactory] Unknown material ID: "${id}". Using fallback.`,
        );
        return new THREE.MeshStandardMaterial({ color: MAT_FALLBACK_COLOR });
    }
  }
}

export default MaterialFactory;
