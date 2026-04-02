'use client';

/**
 * FinishSelector.tsx
 * Radio group — finish options displayed as pill buttons (no images).
 * When availableFinishes is provided, only matching finishes are shown.
 *
 * Mapping from Drupal field_finiture_usa values to R3F FinishId:
 *   solid          → Solid
 *   chrome         → Chrome
 *   opalescent_off → OpalOff
 *   opalescent_on  → OpalOn
 *   satin          → (reserved for future use)
 */

import { useShallow } from 'zustand/react/shallow';
import useMaterialStore, {
  FINISH_SOLID,
  FINISH_CHROME,
  FINISH_OPAL_OFF,
  FINISH_OPAL_ON,
} from '@/r3f/vetrite/stores/useMaterialStore';
import type { FinishId } from '@/r3f/vetrite/types';

/** All finish options in display order */
const ALL_FINISHES: { id: FinishId; label: string; drupalKey: string }[] = [
  { id: FINISH_SOLID, label: 'Solid', drupalKey: 'solid' },
  { id: FINISH_CHROME, label: 'Chrome', drupalKey: 'chrome' },
  { id: FINISH_OPAL_OFF, label: 'Opal Off', drupalKey: 'opalescent_off' },
  { id: FINISH_OPAL_ON, label: 'Opal On', drupalKey: 'opalescent_on' },
];

interface FinishSelectorProps {
  /** When provided, only finishes whose drupalKey is in this array are shown */
  availableFinishes?: string[];
}

export default function FinishSelector({
  availableFinishes,
}: FinishSelectorProps) {
  const { activeFinish, setActiveFinish } = useMaterialStore(
    useShallow((s) => ({
      activeFinish: s.activeFinish,
      setActiveFinish: s.setActiveFinish,
    })),
  );

  const finishes =
    availableFinishes && availableFinishes.length > 0
      ? ALL_FINISHES.filter((f) => availableFinishes.includes(f.drupalKey))
      : ALL_FINISHES;

  return (
    <div data-name="FinishSelector">
      <div
        role="radiogroup"
        aria-label="Select finish"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {finishes.map((finish) => {
          const active = activeFinish === finish.id;
          return (
            <button
              key={finish.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${finish.label} finish`}
              onClick={() => setActiveFinish(finish.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 1rem',
                fontSize: 'var(--hs-caption, 12px)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'var(--hs-font-body)',
                border: active
                  ? '1.5px solid var(--hs-surface-on, #1c1c1a)'
                  : '1.5px solid var(--hs-surface-high-4, #a8a89f)',
                borderRadius: 'var(--hs-radius-full, 9999px)',
                background: active
                  ? 'var(--hs-surface-on, #1c1c1a)'
                  : 'transparent',
                color: active
                  ? 'var(--hs-surface, #fafaf8)'
                  : 'var(--hs-surface-on, #1c1c1a)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {finish.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
