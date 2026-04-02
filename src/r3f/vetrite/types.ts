import type * as THREE from 'three';

// ─── FINISH / MATERIAL IDS ────────────────────────────────────────────────────
export type FinishId = 'Solid' | 'Chrome' | 'OpalOff' | 'OpalOn';
export type GlassId = 'Glass';
export type MaterialId = FinishId | GlassId;

// ─── HDRI ─────────────────────────────────────────────────────────────────────
export type HdriId = 'RR';

// ─── MATERIAL PARAM INTERFACES ────────────────────────────────────────────────
export interface SolidMaterialParams {
  color: number;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  specularIntensity: number;
  reflectivity: number;
}

export interface ChromeMaterialParams {
  color: number;
  roughness: number;
  metalness: number;
  envMapIntensity: number;
}

export interface GlassMaterialParams {
  color: number;
  roughness: number;
  metalness: number;
  transmission: number;
  thickness: number;
  ior: number;
  clearcoat: number;
  clearcoatRoughness: number;
  specularIntensity: number;
  reflectivity: number;
  transparent: boolean;
  opacity: number;
}

export interface OpalOffMaterialParams {
  color: number;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  specularIntensity: number;
  reflectivity: number;
  emissiveIntensity: number;
}

export interface OpalOnMaterialParams {
  color: number;
  roughness: number;
  metalness: number;
  emissive: number;
  emissiveIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  specularIntensity: number;
  reflectivity: number;
  sheen: number;
  sheenColor: number;
  sheenRoughness: number;
}

export interface GlassOpalOffOverrides {
  specularIntensity: number;
  reflectivity: number;
  clearcoat: number;
  clearcoatRoughness: number;
}

// ─── OPAL MATERIAL ────────────────────────────────────────────────────────────
export type OpalVariant = 'on' | 'off';

// ─── MATERIAL FACTORY OPTIONS ─────────────────────────────────────────────────
export interface MaterialFactoryOptions {
  finishMap?: THREE.Texture | null;
}

// ─── MATERIAL SERVICE STATE ───────────────────────────────────────────────────
export interface MaterialServiceState {
  materials: Record<string, THREE.Material>;
  _envMap: THREE.Texture | null;
  _finishMap: THREE.Texture | null;
  _envMapIntensity: number;
  _envMapRotationY: number;
  get: (id: string) => THREE.Material;
  setEnvMap: (envMap: THREE.Texture | null) => void;
  setEnvMapIntensity: (intensity: number) => void;
  setEnvMapRotationY: (rotationY: number) => void;
  setFinishMap: (texture: THREE.Texture | null) => void;
  dispose: (id: string) => void;
  disposeAll: () => void;
  setMaterialColor: (id: string, hex: string) => void;
  setMaterialEmissive: (id: string, hex: string) => void;
}

// ─── MATERIAL STORE STATE ─────────────────────────────────────────────────────
export interface MaterialStoreState {
  activeFinish: FinishId;
  hdriId: string;
  envIntensity: number;
  envRotationY: number;
  toneMapping: THREE.ToneMapping;
  outputColorSpace: THREE.ColorSpace;
  toneMappingExposure: number;
  ambientIntensity: number;
  keyIntensity: number;
  fillIntensity: number;
  opalBacklightIntensity: number;
  opalOffColor: string;
  opalEmissivePreset: string;
  opalEmissiveColor: string;
  canvasBgColor: string;
  canvasTransparent: boolean;
  isMirrored: boolean;
  setCanvasBgColor: (hex: string) => void;
  setCanvasTransparent: (value: boolean) => void;
  setActiveFinish: (id: FinishId) => boolean;
  setHdriId: (id: string) => void;
  setEnvIntensity: (value: number) => void;
  setEnvRotationY: (value: number) => void;
  setToneMapping: (value: THREE.ToneMapping) => void;
  setOutputColorSpace: (value: THREE.ColorSpace) => void;
  setToneMappingExposure: (value: number) => void;
  setAmbientIntensity: (value: number) => void;
  setKeyIntensity: (value: number) => void;
  setFillIntensity: (value: number) => void;
  setOpalBacklightIntensity: (value: number) => void;
  setOpalOffColor: (hex: string) => void;
  setOpalEmissivePreset: (preset: string) => void;
  toggleMirror: () => void;
}

// ─── CANVAS PROPS ─────────────────────────────────────────────────────────────
export interface VetriteCanvasProps {
  textureUrl: string;
  alt?: string;
  productTitle?: string;
  collectionName?: string;
  /** When set, only these finishes are shown in the selector (US market filter) */
  availableFinishes?: string[];
}
