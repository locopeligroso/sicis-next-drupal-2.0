'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';

export default function useFullscreen(
  containerRef: RefObject<HTMLElement | null>,
) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      if (document.fullscreenElement === containerRef.current) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [containerRef]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenEnabled) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }

    container.requestFullscreen().catch(() => {});
  }, [containerRef]);

  return { isFullscreen, toggleFullscreen };
}
