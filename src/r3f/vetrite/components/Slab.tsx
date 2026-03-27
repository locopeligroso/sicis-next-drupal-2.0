'use client';

import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { damp } from 'maath/easing';
import { BoxGeometry } from 'three';
import type * as THREE from 'three';
import useGlassMaterial from '@/r3f/vetrite/hooks/useGlassMaterial';
import useMouseTracking from '@/r3f/vetrite/hooks/useMouseTracking';
import useSlabMaterial from '@/r3f/vetrite/hooks/useSlabMaterial';
import useMaterialStore from '@/r3f/vetrite/stores/useMaterialStore';
import {
  GLASS_DEPTH,
  MIRROR_SMOOTH_TIME,
  SLAB_HEIGHT,
  SLAB_ROTATION_Y,
  SLAB_WIDTH,
} from '@/r3f/vetrite/config/sceneConfig';

// ─── SlabMeshes ───────────────────────────────────────────────────────────────
// Renders the three meshes that make up one slab: back glass, slate, front glass.
// Accepts pre-created geometry instances so each slab pair can own its own geometry.
interface SlabMeshesProps {
  glassGeometry: BoxGeometry;
  slateMaterial: THREE.Material | null;
  glassMaterial: THREE.Material | null;
}

function SlabMeshes({
  glassGeometry,
  slateMaterial,
  glassMaterial,
}: SlabMeshesProps): React.JSX.Element {
  const halfGlassDepth = GLASS_DEPTH * 0.5;
  return (
    <>
      {/* dispose={null}: materials are cached by useMaterialService — R3F must not dispose them on remount */}
      <mesh
        geometry={glassGeometry}
        material={glassMaterial ?? undefined}
        position={[0, 0, -halfGlassDepth]}
        castShadow
        receiveShadow
        dispose={null}
      />
      {/* slateGeometry is single-use — R3F handles disposal automatically */}
      <mesh
        material={slateMaterial ?? undefined}
        castShadow
        receiveShadow
        dispose={null}
      >
        <planeGeometry args={[SLAB_WIDTH, SLAB_HEIGHT]} />
      </mesh>
      <mesh
        geometry={glassGeometry}
        material={glassMaterial ?? undefined}
        position={[0, 0, halfGlassDepth]}
        castShadow
        receiveShadow
        dispose={null}
      />
    </>
  );
}

// ─── Progress ref shape ────────────────────────────────────────────────────────
interface ProgressRef {
  current: number;
}

// ─── Slab ─────────────────────────────────────────────────────────────────────
const Slab = memo(function Slab(): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const origGroupRef = useRef<THREE.Group>(null);
  const mirrorGroupRef = useRef<THREE.Group>(null);
  // progressRef holds a mutable object so maath/easing damp(obj, prop, target) can mutate it.
  const progressRef = useRef<ProgressRef>({ current: 0 });

  const slateMaterial = useSlabMaterial();
  const glassMaterial = useGlassMaterial();
  useMouseTracking(groupRef);

  // Primary slab geometry — shared between front and back glass meshes of the first slab.
  // glassGeometry is shared between two meshes (front + back glass),
  // so it cannot be converted to JSX declarative — dispose imperatively on unmount.
  const glassGeometry = useMemo(
    () => new BoxGeometry(SLAB_WIDTH, SLAB_HEIGHT, GLASS_DEPTH),
    [],
  );

  // Mirrored slab geometry — separate instance required because scale.x = -1 on a shared
  // geometry would affect both slabs. Each slab owns its own geometry allocation.
  const mirroredGlassGeometry = useMemo(
    () => new BoxGeometry(SLAB_WIDTH, SLAB_HEIGHT, GLASS_DEPTH),
    [],
  );

  useEffect(() => {
    return () => {
      glassGeometry.dispose();
    };
  }, [glassGeometry]);

  useEffect(() => {
    return () => {
      mirroredGlassGeometry.dispose();
    };
  }, [mirroredGlassGeometry]);

  // Offset = half slab width so the two slabs touch exactly at the center seam.
  const offset = SLAB_WIDTH * 0.5;

  // Animate mirror transition: progress 0→1 when mirroring, 1→0 when unmirroring.
  // maath/easing damp(obj, prop, target, smoothTime, delta) mutates obj[prop].
  // smoothTime ≈ 1/lambda — lambda=6 → smoothTime≈0.167 gives ~0.7s ease-out feel.
  // Original slab slides right (0 → +offset); mirror slab enters from off-screen left.
  useFrame((_, delta) => {
    const target = useMaterialStore.getState().isMirrored ? 1 : 0;
    damp(progressRef.current, 'current', target, MIRROR_SMOOTH_TIME, delta);
    const p = progressRef.current.current;
    if (origGroupRef.current) origGroupRef.current.position.x = p * offset;
    if (mirrorGroupRef.current) {
      mirrorGroupRef.current.position.x = -(offset * 6) + p * offset * 5;
      mirrorGroupRef.current.visible = p > 0.001;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, SLAB_ROTATION_Y, 0]}>
      {/* Original slab — starts at center (x=0), slides right to +offset */}
      <group ref={origGroupRef}>
        <SlabMeshes
          glassGeometry={glassGeometry}
          slateMaterial={slateMaterial}
          glassMaterial={glassMaterial}
        />
      </group>
      {/* Mirror slab — starts off-screen left at -(offset*3), slides to -offset */}
      <group
        ref={mirrorGroupRef}
        position={[-(offset * 6), 0, 0]}
        scale={[-1, 1, 1]}
      >
        <SlabMeshes
          glassGeometry={mirroredGlassGeometry}
          slateMaterial={slateMaterial}
          glassMaterial={glassMaterial}
        />
      </group>
    </group>
  );
});

export default Slab;
