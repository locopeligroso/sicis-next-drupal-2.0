import * as THREE from 'three';
import { GLASS_MATERIAL_PARAMS } from '@/r3f/vetrite/config/sceneConfig';

/**
 * Glass finish material.
 * Transparent float glass panels wrapping the slab (front and back).
 * IOR 1.5 = real float glass. Smooth clearcoat. No emission.
 * Extends MeshPhysicalMaterial to support transmission and IOR.
 */
class GlassMaterial extends THREE.MeshPhysicalMaterial {
  constructor() {
    super({ ...GLASS_MATERIAL_PARAMS });
  }
}

export default GlassMaterial;
