'use client';

/**
 * FinishSelector.tsx
 * Radio group — 4 finish options: Solid, Chrome, OpalOff, OpalOn.
 * Each option has a circular thumbnail image + label.
 *
 * DOM structure mirrors sicis-vetrite-next FinishSelector.jsx exactly.
 * All visual styling via CSS classes from vetrite-canvas.css.
 */

import { useShallow } from 'zustand/react/shallow';
import useMaterialStore, {
  FINISH_SOLID,
  FINISH_CHROME,
  FINISH_OPAL_OFF,
  FINISH_OPAL_ON,
} from '@/r3f/vetrite/stores/useMaterialStore';
import type { FinishId } from '@/r3f/vetrite/types';

export default function FinishSelector() {
  const { activeFinish, setActiveFinish } = useMaterialStore(
    useShallow((s) => ({
      activeFinish: s.activeFinish,
      setActiveFinish: s.setActiveFinish,
    })),
  );

  const isActive = (id: FinishId) => activeFinish === id;

  const ringClass = (id: FinishId) =>
    isActive(id) ? 'hs-thumb-ring hs-thumb-ring--selected' : 'hs-thumb-ring';

  return (
    <fieldset className="hs-finish-selector" data-name="FinishSelector">
      <legend className="hs-finish-selector__label">SELECT FINISH</legend>

      <div
        className="hs-finish-options"
        role="radiogroup"
        aria-label="Select finish"
      >
        {/* Solid */}
        <button
          type="button"
          className="hs-finish-option"
          role="radio"
          aria-checked={isActive(FINISH_SOLID)}
          aria-label="Solid finish"
          onClick={() => setActiveFinish(FINISH_SOLID)}
        >
          <div className={ringClass(FINISH_SOLID)}>
            <div className="hs-thumb">
              <img alt="" src="/assets/vetrite/finish-solid.jpg" />
            </div>
          </div>
          <span className="hs-finish-option__name">Solid</span>
        </button>

        {/* Chrome */}
        <button
          type="button"
          className="hs-finish-option"
          role="radio"
          aria-checked={isActive(FINISH_CHROME)}
          aria-label="Chrome finish"
          onClick={() => setActiveFinish(FINISH_CHROME)}
        >
          <div className={ringClass(FINISH_CHROME)}>
            <div className="hs-thumb">
              <img alt="" src="/assets/vetrite/finish-chrome.jpg" />
            </div>
          </div>
          <span className="hs-finish-option__name">Chrome</span>
        </button>

        {/* Opalescent OFF */}
        <button
          type="button"
          className="hs-finish-option"
          role="radio"
          aria-checked={isActive(FINISH_OPAL_OFF)}
          aria-label="Opalescent finish, backlight off"
          onClick={() => setActiveFinish(FINISH_OPAL_OFF)}
        >
          <div className={ringClass(FINISH_OPAL_OFF)}>
            <div className="hs-thumb--fixed">
              <img alt="" src="/assets/vetrite/finish-opal.jpg" />
            </div>
            <span className="hs-chip" aria-hidden="true">
              OFF
            </span>
          </div>
          <span className="hs-finish-option__name">Opalescent</span>
        </button>

        {/* Opalescent ON */}
        <button
          type="button"
          className="hs-finish-option"
          role="radio"
          aria-checked={isActive(FINISH_OPAL_ON)}
          aria-label="Opalescent finish, backlight on"
          onClick={() => setActiveFinish(FINISH_OPAL_ON)}
        >
          <div className={ringClass(FINISH_OPAL_ON)}>
            <div className="hs-thumb--fixed">
              {/* Two images stacked: base + glow layer */}
              <div aria-hidden="true" className="hs-thumb__layers">
                <img alt="" src="/assets/vetrite/finish-opal.jpg" />
                <img alt="" src="/assets/vetrite/finish-opal-glow.jpg" />
              </div>
            </div>
            <span className="hs-chip hs-chip--on-pos" aria-hidden="true">
              ON
            </span>
          </div>
          <span className="hs-finish-option__name">Opalescent</span>
        </button>
      </div>
    </fieldset>
  );
}
