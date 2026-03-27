'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import useMaterialStore from '@/r3f/vetrite/stores/useMaterialStore';

/**
 * RendererSync
 * Syncs toneMapping, outputColorSpace, toneMappingExposure from the Zustand store
 * to the WebGL renderer in real time.
 * Must live inside <Canvas> to access useThree().
 */
export default function RendererSync(): null {
  const { gl } = useThree();
  const toneMapping = useMaterialStore((s) => s.toneMapping);
  const outputColorSpace = useMaterialStore((s) => s.outputColorSpace);
  const exposure = useMaterialStore((s) => s.toneMappingExposure);
  const canvasBgColor = useMaterialStore((s) => s.canvasBgColor);
  const canvasTransparent = useMaterialStore((s) => s.canvasTransparent);

  useEffect(() => {
    gl.toneMapping = toneMapping;
    gl.outputColorSpace = outputColorSpace;
    gl.toneMappingExposure = exposure;
  }, [gl, toneMapping, outputColorSpace, exposure]);

  useEffect(() => {
    gl.setClearColor(canvasBgColor, canvasTransparent ? 0 : 1);
  }, [gl, canvasBgColor, canvasTransparent]);

  return null;
}
