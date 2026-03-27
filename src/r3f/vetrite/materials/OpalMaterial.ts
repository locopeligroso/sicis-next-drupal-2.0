import * as THREE from 'three';
import {
  OPAL_OFF_MATERIAL_PARAMS,
  OPAL_ON_MATERIAL_PARAMS,
} from '@/r3f/vetrite/config/sceneConfig';
import type { OpalVariant } from '@/r3f/vetrite/types';

class OpalMaterial extends THREE.MeshPhysicalMaterial {
  readonly #isOn: boolean;

  constructor(variant: OpalVariant = 'off') {
    const isOn = variant === 'on';
    const params = isOn ? OPAL_ON_MATERIAL_PARAMS : OPAL_OFF_MATERIAL_PARAMS;
    super({ ...params });
    this.#isOn = isOn;
  }

  /**
   * Apply the product texture as emissive map (ON variant only).
   * Simulates backlighting that follows the texture veining.
   */
  setEmissiveMap(texture: THREE.Texture): void {
    if (!this.#isOn) return;
    this.emissiveMap = texture;
    this.needsUpdate = true;
  }

  /**
   * Change the emissive color at runtime (ON variant only).
   * Used by backlight presets to tint the opal backlight glow.
   */
  setEmissiveColor(hexColor: number): void {
    if (!this.#isOn) return;
    this.emissive.set(hexColor);
    // No needsUpdate: emissive is a uniform — color changes don't require shader recompile
  }
}

export default OpalMaterial;
