'use client';

import { Suspense, useEffect, useMemo, useRef, memo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import CanvasErrorBoundary from '@/r3f/vetrite/components/ErrorBoundary';
import FullscreenButton from '@/r3f/vetrite/components/FullscreenButton';
import FullscreenControls from '@/r3f/vetrite/components/FullscreenControls';
import useFullscreen from '@/r3f/vetrite/hooks/useFullscreen';
import useMaterialService from '@/r3f/vetrite/stores/useMaterialService';
import useMaterialStore from '@/r3f/vetrite/stores/useMaterialStore';
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_LOOK_AT,
  CAMERA_NEAR,
  CAMERA_POSITION,
  CANVAS_GL,
  FINISH_IDS,
  INITIAL_OUTPUT_COLOR_SPACE,
  MAT_GLASS,
  RENDERER_MAX_PIXEL_RATIO,
  SHADOW_MAP_TYPE,
} from '@/r3f/vetrite/config/sceneConfig';
import RendererSync from '@/r3f/vetrite/components/RendererSync';
import SceneEnvironment from '@/r3f/vetrite/components/SceneEnvironment';
import SceneLights from '@/r3f/vetrite/components/SceneLights';
import ShadowPlane from '@/r3f/vetrite/components/ShadowPlane';
import Slab from '@/r3f/vetrite/components/Slab';
import useFinishTexture from '@/r3f/vetrite/hooks/useFinishTexture';
import type { VetriteCanvasProps } from '@/r3f/vetrite/types';
import './vetrite-canvas.css';

// ─── Module-level constants — hoisted to avoid inline object recreation ───────
const CANVAS_CAMERA = {
  fov: CAMERA_FOV,
  near: CAMERA_NEAR,
  far: CAMERA_FAR,
  position: CAMERA_POSITION,
};

function handleCanvasCreated({
  gl,
  camera,
}: {
  gl: THREE.WebGLRenderer;
  camera: THREE.Camera;
}) {
  gl.outputColorSpace = INITIAL_OUTPUT_COLOR_SPACE;
  // Initial clear color from store — RendererSync will keep it in sync afterwards
  const { canvasBgColor, canvasTransparent } = useMaterialStore.getState();
  gl.setClearColor(canvasBgColor, canvasTransparent ? 0 : 1);
  camera.lookAt(...CAMERA_LOOK_AT);
}

// ─── TextureLoader ────────────────────────────────────────────────────────────
// Inner component that loads the texture inside the Canvas (needs R3F context).
// Must be separate so hooks execute inside <Canvas>.
interface TextureLoaderProps {
  textureUrl: string;
}

function TextureLoader({ textureUrl }: TextureLoaderProps): null {
  useFinishTexture(textureUrl);
  return null;
}

// ─── SceneContent ─────────────────────────────────────────────────────────────
// memo: SceneContent has stable props — prevents re-render on parent resize
const SceneContent = memo(function SceneContent({
  textureUrl,
}: {
  textureUrl: string;
}): React.JSX.Element {
  return (
    <>
      <RendererSync />
      <TextureLoader textureUrl={textureUrl} />
      <SceneEnvironment />
      <SceneLights />
      <ShadowPlane />
      <Slab />
    </>
  );
});

// ─── VetriteCanvas ────────────────────────────────────────────────────────────
/**
 * VetriteCanvas — main entry point for the R3F glass slab 3D viewer.
 *
 * Props:
 *   textureUrl: string  — URL of the product finish texture (e.g. field_immagine from Drupal)
 *   alt?: string        — Accessible label for the canvas region
 *
 * Usage:
 *   <VetriteCanvas textureUrl="/assets/images/product-texture.jpg" alt="Vetrite product view" />
 *
 * Dynamic import with ssr: false is required (R3F requires browser environment):
 *   const VetriteCanvas = dynamic(() => import('@/r3f/vetrite/VetriteCanvas'), { ssr: false })
 */
export default function VetriteCanvas({
  textureUrl,
  alt = '3D product preview',
  productTitle,
  collectionName,
}: VetriteCanvasProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
  const canvasBgColor = useMaterialStore((s) => s.canvasBgColor);
  const canvasTransparent = useMaterialStore((s) => s.canvasTransparent);

  // Recompute style only when bg color or transparency flag changes
  const canvasStyle = useMemo(
    () => ({ background: canvasTransparent ? 'transparent' : canvasBgColor }),
    [canvasBgColor, canvasTransparent],
  );

  // Pre-warm all materials on mount to avoid shader-compile jank on first finish switch.
  useEffect(() => {
    const svc = useMaterialService.getState();
    FINISH_IDS.forEach((id) => svc.get(id));
    svc.get(MAT_GLASS);
    return () => {
      useMaterialService.getState().disposeAll();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={alt}
      className="hs-product-canvas"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        position: 'relative',
        background: isFullscreen ? '#fafaf8' : undefined,
      }}
    >
      <FullscreenButton
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />
      <FullscreenControls
        isVisible={isFullscreen}
        productTitle={productTitle}
        collectionName={collectionName}
      />
      <CanvasErrorBoundary>
        <Canvas
          shadows={SHADOW_MAP_TYPE as unknown as boolean}
          dpr={[1, RENDERER_MAX_PIXEL_RATIO]}
          camera={CANVAS_CAMERA}
          gl={CANVAS_GL}
          style={canvasStyle}
          onCreated={handleCanvasCreated}
        >
          <Suspense fallback={null}>
            <SceneContent textureUrl={textureUrl} />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
