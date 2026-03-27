import * as THREE from 'three';
import { SOLID_MATERIAL_PARAMS } from '@/r3f/vetrite/config/sceneConfig';

/**
 * Solid finish material.
 * Laminated glass with coloured polymer layer; external surface smooth and glossy.
 * Extends MeshPhysicalMaterial to support clearcoat and specular response.
 */
class SolidMaterial extends THREE.MeshPhysicalMaterial {
  constructor() {
    super({ ...SOLID_MATERIAL_PARAMS });
  }
}

export default SolidMaterial;
