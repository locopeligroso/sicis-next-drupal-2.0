'use client';

import { useShallow } from 'zustand/react/shallow';
import useMaterialStore from '@/r3f/vetrite/stores/useMaterialStore';
import {
  AMBIENT_COLOR,
  FILL_COLOR,
  FILL_POSITION,
  KEY_COLOR,
  KEY_POSITION,
  KEY_SHADOW_BIAS,
  KEY_SHADOW_CAMERA,
  KEY_SHADOW_MAP_SIZE,
  KEY_SHADOW_RADIUS,
  OPAL_BACKLIGHT_COLOR,
  OPAL_BACKLIGHT_DISTANCE,
  OPAL_BACKLIGHT_POSITION,
} from '@/r3f/vetrite/config/sceneConfig';

// Hoisted to avoid new array allocation on every render
const KEY_SHADOW_MAP: [number, number] = [
  KEY_SHADOW_MAP_SIZE,
  KEY_SHADOW_MAP_SIZE,
];

export default function SceneLights(): React.JSX.Element {
  const {
    ambientIntensity,
    keyIntensity,
    fillIntensity,
    opalBacklightIntensity,
  } = useMaterialStore(
    useShallow((s) => ({
      ambientIntensity: s.ambientIntensity,
      keyIntensity: s.keyIntensity,
      fillIntensity: s.fillIntensity,
      opalBacklightIntensity: s.opalBacklightIntensity,
    })),
  );

  return (
    <>
      <ambientLight color={AMBIENT_COLOR} intensity={ambientIntensity} />

      <directionalLight
        color={KEY_COLOR}
        intensity={keyIntensity}
        position={KEY_POSITION}
        castShadow
        shadow-mapSize={KEY_SHADOW_MAP}
        shadow-camera-left={KEY_SHADOW_CAMERA.left}
        shadow-camera-right={KEY_SHADOW_CAMERA.right}
        shadow-camera-top={KEY_SHADOW_CAMERA.top}
        shadow-camera-bottom={KEY_SHADOW_CAMERA.bottom}
        shadow-camera-near={KEY_SHADOW_CAMERA.near}
        shadow-camera-far={KEY_SHADOW_CAMERA.far}
        shadow-radius={KEY_SHADOW_RADIUS}
        shadow-bias={KEY_SHADOW_BIAS}
      />

      <directionalLight
        color={FILL_COLOR}
        intensity={fillIntensity}
        position={FILL_POSITION}
      />

      <pointLight
        color={OPAL_BACKLIGHT_COLOR}
        intensity={opalBacklightIntensity}
        distance={OPAL_BACKLIGHT_DISTANCE}
        position={OPAL_BACKLIGHT_POSITION}
      />
    </>
  );
}
