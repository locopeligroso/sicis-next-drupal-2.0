'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { ClampToEdgeWrapping, SRGBColorSpace } from 'three';
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

  // Configure color space, wrapping, and anisotropy (once only)
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.anisotropy = maxAnisotropy.current;
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
