import * as THREE from 'three';
import { CHROME_MATERIAL_PARAMS } from '@/r3f/vetrite/config/sceneConfig';

/**
 * Chrome finish material.
 * Extends MeshStandardMaterial (not MeshPhysicalMaterial) intentionally:
 * - Chrome is pure metallic reflection — no clearcoat, transmission, or IOR needed
 * - MeshStandardMaterial has lower per-pixel GPU cost than MeshPhysicalMaterial
 * - envMapIntensity is set high (1.8) to capture HDRI vividly
 */
class ChromeMaterial extends THREE.MeshStandardMaterial {
  constructor() {
    super({ ...CHROME_MATERIAL_PARAMS });
  }
}

export default ChromeMaterial;
