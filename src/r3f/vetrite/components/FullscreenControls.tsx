'use client';

/**
 * FullscreenControls.tsx
 * HUD sidebar panel — appears in fullscreen mode, anchored top-left.
 *
 * Props:
 *   isVisible      — true when canvas is in fullscreen
 *   productTitle   — product name (e.g. "Reef")
 *   collectionName — collection name (e.g. "Gem Glass Collection")
 *
 * Layout (top to bottom):
 *   1. Identity block (product name + collection)
 *   2. Finish selector
 *   3. Opal toggle
 *   4. Backlight selector (visible only when OpalOn)
 *   5. Mirror button
 *
 * Visibility: aria-hidden attribute drives CSS transitions (opacity + translateX).
 * See vetrite-canvas.css — .hs-fsc and .hs-fsc__sidebar rules.
 */

import useMaterialStore, {
  FINISH_OPAL_ON,
} from '@/r3f/vetrite/stores/useMaterialStore';
import FinishSelector from '@/r3f/vetrite/components/FinishSelector';
import OpalToggle from '@/r3f/vetrite/components/OpalToggle';
import MirrorButton from '@/r3f/vetrite/components/MirrorButton';
import BacklightSelector from '@/r3f/vetrite/components/BacklightSelector';

interface FullscreenControlsProps {
  isVisible: boolean;
  productTitle?: string;
  collectionName?: string;
  availableFinishes?: string[];
}

export default function FullscreenControls({
  isVisible,
  productTitle,
  collectionName,
  availableFinishes,
}: FullscreenControlsProps) {
  const activeFinish = useMaterialStore((s) => s.activeFinish);
  const isOpalOn = activeFinish === FINISH_OPAL_ON;

  return (
    /* Root wrapper — pointer-events: none so canvas interactions pass through.
     * aria-hidden drives CSS: opacity fade + sidebar translateX slide-in. */
    <div
      className="hs-fsc"
      aria-hidden={isVisible ? 'false' : 'true'}
      data-name="FullscreenControls"
    >
      {/* Sidebar — pointer-events: auto for interactivity */}
      <aside className="hs-fsc__sidebar" aria-label="Configurator controls">
        {/* ── 1. Identity block ── */}
        {(productTitle || collectionName) && (
          <div className="hs-fsc__identity" aria-hidden="true">
            <span className="hs-fsc__index">GG</span>
            {productTitle && <h2 className="hs-fsc__title">{productTitle}</h2>}
            {collectionName && (
              <span className="hs-fsc__collection">{collectionName}</span>
            )}
          </div>
        )}

        <hr className="hs-fsc__divider" />

        {/* ── 2. Finish selector ── */}
        <div className="hs-fsc__section">
          <span className="hs-fsc__section-label">
            <span className="hs-fsc__section-num">01</span>
            Select Finish
          </span>
          <FinishSelector availableFinishes={availableFinishes} />
        </div>

        <hr className="hs-fsc__divider" />

        {/* ── 3. Opal toggle ── */}
        <div className="hs-fsc__section">
          <span className="hs-fsc__section-label">
            <span className="hs-fsc__section-num">02</span>
            Opalescence
          </span>
          <OpalToggle />
        </div>

        <hr className="hs-fsc__divider" />

        {/* ── 4. Backlight — always in DOM, hidden when opal off (avoids layout shift) */}
        <div
          className={
            isOpalOn
              ? 'hs-fsc__section hs-fsc__section--backlight'
              : 'hs-fsc__section hs-fsc__section--backlight hs-fsc__section--backlight-hidden'
          }
          aria-hidden={isOpalOn ? 'false' : 'true'}
        >
          <span className="hs-fsc__section-label">
            <span className="hs-fsc__section-num">03</span>
            Backlight
          </span>
          <BacklightSelector />
        </div>

        {/* ── 5. Mirror button ── */}
        <div className="hs-fsc__section hs-fsc__section--mirror">
          <span className="hs-fsc__section-label">
            <span className="hs-fsc__section-num">
              {isOpalOn ? '04' : '03'}
            </span>
            View
          </span>
          <MirrorButton />
        </div>
      </aside>
    </div>
  );
}
