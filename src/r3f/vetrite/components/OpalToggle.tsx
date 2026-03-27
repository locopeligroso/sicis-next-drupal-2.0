'use client';

/**
 * OpalToggle.tsx
 * Pill toggle (OFF / ON) for opalescence.
 * Disabled when Solid or Chrome is the active finish.
 *
 * Design: pill 3.75rem × 1.875rem, knob 1.375rem × 1.375rem.
 * ON:  teal background, knob translateX(1.875rem).
 * OFF: rgba(28,28,26,0.12) background, knob translateX(0).
 * Disabled (Solid/Chrome): opacity 0.3, pointer-events none.
 *
 * All visual styling via CSS classes from vetrite-canvas.css (.hs-opal-toggle).
 */

import useMaterialStore, {
  FINISH_OPAL_OFF,
  FINISH_OPAL_ON,
} from '@/r3f/vetrite/stores/useMaterialStore';

export default function OpalToggle() {
  const activeFinish = useMaterialStore((s) => s.activeFinish);
  const setActiveFinish = useMaterialStore((s) => s.setActiveFinish);

  const isOpalActive =
    activeFinish === FINISH_OPAL_ON || activeFinish === FINISH_OPAL_OFF;
  const isOn = activeFinish === FINISH_OPAL_ON;

  const handleToggle = () => {
    if (!isOpalActive) return;
    setActiveFinish(isOn ? FINISH_OPAL_OFF : FINISH_OPAL_ON);
  };

  return (
    <div
      className={
        isOpalActive
          ? 'hs-opal-toggle'
          : 'hs-opal-toggle hs-opal-toggle--disabled'
      }
    >
      {/* Pill switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label="Opalescence"
        tabIndex={isOpalActive ? 0 : -1}
        className={
          isOn
            ? 'hs-opal-toggle__pill hs-opal-toggle__pill--on'
            : 'hs-opal-toggle__pill'
        }
        onClick={handleToggle}
      >
        <span className="hs-opal-toggle__knob" aria-hidden="true" />
      </button>

      {/* State label */}
      <span className="hs-opal-toggle__state-label" aria-hidden="true">
        {isOn ? 'On' : 'Off'}
      </span>
    </div>
  );
}
