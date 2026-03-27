'use client';

import { useEffect } from 'react';
import { useEnvironment } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import useMaterialStore from '@/r3f/vetrite/stores/useMaterialStore';
import useMaterialService from '@/r3f/vetrite/stores/useMaterialService';
import {
  HDRI_OPTIONS,
  DEFAULT_HDRI_ID,
} from '@/r3f/vetrite/config/sceneConfig';

export default function SceneEnvironment(): null {
  const scene = useThree((state) => state.scene);

  // Granular primitive selectors — no setter functions in deps
  const hdriId = useMaterialStore((state) => state.hdriId);
  const envIntensity = useMaterialStore((state) => state.envIntensity);
  const envRotationY = useMaterialStore((state) => state.envRotationY);

  // useEnvironment loads the HDRI at full resolution via useLoader (memoised by path).
  // Hardcoded to RR HDRI — only one HDRI supported in this module.
  const hdriPath = HDRI_OPTIONS[hdriId] ?? HDRI_OPTIONS[DEFAULT_HDRI_ID];
  const envTexture = useEnvironment({ files: hdriPath });

  // Propagate envTexture to scene + useMaterialService whenever it changes.
  // scene.background = null: canvas clearColor (alpha=0) shows through.
  useEffect(() => {
    scene.background = null;
    scene.environment = envTexture;
    scene.environmentIntensity = envIntensity;
    scene.environmentRotation.y = envRotationY;

    const svc = useMaterialService.getState();
    svc.setEnvMap(envTexture);
    svc.setEnvMapIntensity(envIntensity);
    svc.setEnvMapRotationY(envRotationY);

    return () => {
      scene.environment = null;
      useMaterialService.getState().setEnvMap(null);
    };
  }, [envTexture, envIntensity, envRotationY, scene]);

  return null;
}
