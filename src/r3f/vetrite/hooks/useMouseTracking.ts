'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Object3D, Quaternion, Vector3 } from 'three';
import type * as THREE from 'three';
import {
  MOUSE_TRACK_SCALE,
  MOUSE_TRACK_Z_OFFSET,
  SLAB_SLERP_FACTOR,
} from '@/r3f/vetrite/config/sceneConfig';

/**
 * useMouseTracking
 * Attaches mouse enter/leave/move listeners to the canvas and updates the
 * target quaternion for the slab group on each frame via slerp interpolation.
 *
 * @param groupRef - Ref to the Three.js Group to rotate
 */
export default function useMouseTracking(
  groupRef: RefObject<THREE.Group | null>,
): void {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const cameraRef = useRef(camera);
  const isHoveredRef = useRef(false);
  const targetQuatRef = useRef(new Quaternion());
  const restQuatRef = useRef(new Quaternion());
  // useRef for mutable Three.js objects — semantically correct (mutated, not derived)
  // and excluded from dep arrays without ESLint warnings
  const tempObjectRef = useRef(new Object3D());
  const targetVectorRef = useRef(new Vector3());

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    restQuatRef.current.copy(group.quaternion);
    targetQuatRef.current.copy(group.quaternion);
  }, [groupRef]);

  useEffect(() => {
    const canvas = gl.domElement;

    const onMouseEnter = () => {
      isHoveredRef.current = true;
    };

    const onMouseLeave = () => {
      isHoveredRef.current = false;
      targetQuatRef.current.copy(restQuatRef.current);
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isHoveredRef.current || !groupRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const nx = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
      );
      const ny = Math.max(
        -1,
        Math.min(1, -((event.clientY - rect.top) / rect.height) * 2 + 1),
      );

      targetVectorRef.current.set(
        nx * MOUSE_TRACK_SCALE,
        ny * MOUSE_TRACK_SCALE,
        cameraRef.current.position.z - MOUSE_TRACK_Z_OFFSET,
      );

      tempObjectRef.current.position.copy(groupRef.current.position);
      tempObjectRef.current.lookAt(targetVectorRef.current);
      targetQuatRef.current.copy(tempObjectRef.current.quaternion);
    };

    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('mousemove', onMouseMove);

    return () => {
      canvas.removeEventListener('mouseenter', onMouseEnter);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, [gl.domElement, groupRef]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.quaternion.slerp(targetQuatRef.current, SLAB_SLERP_FACTOR);
  });
}
