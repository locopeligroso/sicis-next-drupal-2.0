'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SlideData {
  id: string;
  imageUrl: string | null;
  text: string | undefined;
  label: string | undefined;
  link: string | undefined;
}

interface SliderClientProps {
  slides: SlideData[];
  autoplayMs?: number;
}

export default function SliderClient({ slides, autoplayMs = 5000 }: SliderClientProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    setCurrent((index + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Autoplay
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timerRef.current = setInterval(next, autoplayMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, paused, next, autoplayMs, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section
      className="relative w-full border-b border-gray-100 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide image */}
      <div className="w-full aspect-[16/7] md:aspect-[16/6] bg-gray-900 relative">
        {slide.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.id}
            src={slide.imageUrl}
            alt=""
            className="w-full h-full object-cover transition-opacity duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
            Slide {current + 1}
          </div>
        )}

        {/* Text overlay */}
        {(slide.text || slide.label) && (
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent text-white">
            {slide.text && (
              <div
                className="text-lg mb-2 [&_p]:m-0"
                dangerouslySetInnerHTML={{ __html: slide.text }}
              />
            )}
            {slide.label && slide.link && (
              <a
                href={slide.link}
                className="inline-block text-sm uppercase tracking-wider border-b border-white/50 pb-0.5 hover:border-white transition-colors"
              >
                {slide.label}
              </a>
            )}
          </div>
        )}

        {/* Prev / Next arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Slide precedente"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Slide successiva"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Vai alla slide ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {slides.length > 1 && !paused && (
        <div
          key={`${current}-progress`}
          className="absolute bottom-0 left-0 h-0.5 bg-white/60"
          style={{
            animation: `slider-progress ${autoplayMs}ms linear forwards`,
          }}
        />
      )}

      <style>{`
        @keyframes slider-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </section>
  );
}
