'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { ClampToEdgeWrapping, SRGBColorSpace } from 'three';
import { SLAB_ASPECT_RATIO } from '@/r3f/vetrite/config/sceneConfig';
import useMaterialService from '@/r3f/vetrite/stores/useMaterialService';

/**
 * useFinishTexture
 * Loads the product finish texture from the provided URL and propagates it
 * to useMaterialService so all finish materials receive the diffuse map.
 *
 * IMPORTANT: Instead of a static path, this hook accepts a `textureUrl` prop
 * so the parent canvas can supply the product-specific texture at runtime.
 *
 * @param textureUrl - Absolute URL or path to the product texture image
 */
export default function useFinishTexture(textureUrl: string) {
  const gl = useThree((state) => state.gl);
  const maxAnisotropy = useRef(gl.capabilities.getMaxAnisotropy());

  // Load the texture — useTexture is memoised by URL via useLoader
  const texture = useTexture(textureUrl);

  // Configure color space, wrapping, anisotropy, and UV scaling (once only).
  // The slab is taller than wide (aspect ~2.33:1) but textures are typically square.
  // Scale UVs to maintain 1:1 texture proportions (cover mode: fill width, crop height).
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.anisotropy = maxAnisotropy.current;

    // Determine texture aspect ratio (fallback to 1:1 if image not loaded yet)
    const img = texture.image as { width?: number; height?: number } | null;
    const imgW = img?.width ?? 1;
    const imgH = img?.height ?? 1;
    const textureAspect = imgW / imgH; // e.g. 1.0 for square

    // Keep texture at native 1:1 proportions on the tall slab.
    // The slab plane UVs span [0,1]×[0,1] mapped to SLAB_WIDTH × SLAB_HEIGHT.
    // To render the texture as a square (not stretched), scale U and V so
    // 1 UV unit = same world-space size on both axes.
    // Result: texture appears as a square centered on the slab.
    texture.repeat.set(1, 1 / SLAB_ASPECT_RATIO);
    texture.offset.set(0, (1 - texture.repeat.y) / 2);

    texture.needsUpdate = true;
  }, [texture]);

  // Propagate the texture to MaterialService on mount; clear on unmount
  useEffect(() => {
    useMaterialService.getState().setFinishMap(texture);
    return () => {
      useMaterialService.getState().setFinishMap(null);
    };
  }, [texture]);

  return texture;
}
