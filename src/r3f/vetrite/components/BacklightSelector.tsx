'use client';

/**
 * BacklightSelector.tsx
 * Pill radio group — 3 backlight temperature options: Neutral / Warm / Cold.
 * Acts on the opal emissive color preset.
 *
 * Visible only when OpalOn is active (controlled by parent FullscreenControls).
 *
 * All visual styling via CSS classes from vetrite-canvas.css (.hs-backlight-selector).
 */

import useMaterialStore from '@/r3f/vetrite/stores/useMaterialStore';
import { OPAL_EMISSIVE_PRESETS } from '@/r3f/vetrite/config/sceneConfig';

const PRESET_KEYS = Object.keys(OPAL_EMISSIVE_PRESETS); // ['Neutral', 'Warm', 'Cold']

export default function BacklightSelector() {
  const opalEmissivePreset = useMaterialStore((s) => s.opalEmissivePreset);
  const setOpalEmissivePreset = useMaterialStore(
    (s) => s.setOpalEmissivePreset,
  );

  return (
    <div
      className="hs-backlight-selector"
      role="radiogroup"
      aria-label="Backlight temperature"
    >
      {PRESET_KEYS.map((preset) => {
        const isActive = opalEmissivePreset === preset;
        return (
          <button
            key={preset}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={
              isActive
                ? 'hs-backlight-selector__pill hs-backlight-selector__pill--active'
                : 'hs-backlight-selector__pill'
            }
            onClick={() => setOpalEmissivePreset(preset)}
          >
            {preset}
          </button>
        );
      })}
    </div>
  );
}
