'use client';

/**
 * MirrorButton.tsx
 * Toggle button — em-dash + "Mirror view" italic label + SVG icon.
 * Editorial note style: teal dash + italic label + thin SVG icon to the right.
 *
 * All visual styling via CSS classes from vetrite-canvas.css (.hs-mirror-btn).
 */

import useMaterialStore from '@/r3f/vetrite/stores/useMaterialStore';

function MirrorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Axis of symmetry — vertical dashed line */}
      <line
        x1="12"
        y1="4"
        x2="12"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray="2.5 2"
        strokeLinecap="round"
      />
      {/* Left arrow */}
      <path
        d="M9 8.5 L4.5 12 L9 15.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right arrow */}
      <path
        d="M15 8.5 L19.5 12 L15 15.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function MirrorButton() {
  const toggleMirror = useMaterialStore((s) => s.toggleMirror);

  return (
    <button
      type="button"
      className="hs-mirror-btn"
      aria-label="Mirror slab horizontally"
      onClick={toggleMirror}
    >
      <span className="hs-mirror-btn__dash" aria-hidden="true">
        &mdash;
      </span>
      <span className="hs-mirror-btn__label">Mirror view</span>
      <MirrorIcon />
    </button>
  );
}
