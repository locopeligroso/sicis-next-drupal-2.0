'use client';

import { useEffect, useMemo } from 'react';
import { ShadowMaterial } from 'three';
import {
  SHADOW_PLANE_OPACITY,
  SHADOW_PLANE_ROTATION_X,
  SHADOW_PLANE_SIZE,
  SHADOW_PLANE_Y,
} from '@/r3f/vetrite/config/sceneConfig';

export default function ShadowPlane(): React.JSX.Element {
  // ShadowMaterial has no JSX declarative equivalent in R3F — dispose imperatively on unmount.
  const material = useMemo(
    () => new ShadowMaterial({ opacity: SHADOW_PLANE_OPACITY }),
    [],
  );

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    // geometry is single-use — R3F handles disposal automatically via JSX declarative
    <mesh
      material={material}
      receiveShadow
      rotation={[SHADOW_PLANE_ROTATION_X, 0, 0]}
      position={[0, SHADOW_PLANE_Y, 0]}
    >
      <planeGeometry args={[SHADOW_PLANE_SIZE, SHADOW_PLANE_SIZE]} />
    </mesh>
  );
}
