'use client';

import { useState } from 'react';

const POSITIONS = ['start', 'center', 'end'] as const;

export function InteractiveGrid() {
  const [inlinePos, setInlinePos] = useState(1);
  const [snapStop, setSnapStop] = useState(false);
  const [snapDisabled, setSnapDisabled] = useState(false);

  const snapAlign = POSITIONS[inlinePos];

  return (
    <div className="flex gap-[2vw]">
      {/* Grid */}
      <ul
        className="flex gap-2 px-[160px] py-0 box-border border border-foreground list-none overflow-x-auto w-[20vw]"
        style={{
          background:
            'conic-gradient(at bottom left, red 0deg, yellow 15deg, green 30deg, blue 45deg, purple 60deg, magenta 75deg)',
          backgroundAttachment: 'local',
          scrollPaddingLeft: 80,
          scrollSnapType: snapDisabled ? 'initial' : 'x mandatory',
          overscrollBehaviorX: snapDisabled ? 'initial' : 'contain',
          scrollbarWidth: 'none',
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <li
            key={i}
            className="h-[12.5vw] w-[12.5vw] shrink-0 bg-white text-black font-mono text-5xl text-center flex items-center justify-center"
            style={{
              outline: '3px inset',
              scrollSnapAlign: snapDisabled ? undefined : snapAlign,
              scrollSnapStop: snapStop ? 'always' : 'normal',
            }}
          >
            {i + 1}
          </li>
        ))}
      </ul>

      {/* Controls */}
      <div className="flex-1 space-y-4">
        <fieldset
          className="border border-foreground/30 rounded-lg p-4 space-y-3"
          style={{
            opacity: snapDisabled ? 0.2 : 1,
            pointerEvents: snapDisabled ? 'none' : 'auto',
          }}
        >
          <legend className="font-semibold px-2">Change the options</legend>

          <div className="space-y-1">
            <label className="flex items-center gap-3 font-mono text-sm">
              <input
                type="range"
                min={0}
                max={2}
                value={inlinePos}
                onChange={(e) => setInlinePos(Number(e.target.value))}
                className="accent-primary"
              />
              snap-align: <code className="bg-muted px-1.5 py-0.5 rounded">{POSITIONS[inlinePos]}</code>
            </label>
          </div>

          <label className="flex items-center gap-2 font-mono text-sm">
            <input
              type="checkbox"
              checked={snapStop}
              onChange={(e) => setSnapStop(e.target.checked)}
            />
            Prevent scrolling past boxes
          </label>
        </fieldset>

        <label className="flex items-center gap-2 font-mono text-sm">
          <input
            type="checkbox"
            checked={snapDisabled}
            onChange={(e) => setSnapDisabled(e.target.checked)}
          />
          disable snapping
        </label>

        <div className="font-mono text-xs text-muted-foreground space-y-1 mt-4 p-3 bg-muted rounded-lg">
          <p>scroll-snap-type: {snapDisabled ? 'initial' : 'x mandatory'}</p>
          <p>scroll-snap-align: {snapDisabled ? '—' : snapAlign}</p>
          <p>scroll-snap-stop: {snapStop ? 'always' : 'normal'}</p>
        </div>
      </div>
    </div>
  );
}
