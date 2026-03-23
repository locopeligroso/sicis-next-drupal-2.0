'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const HIDE_THRESHOLD = 50

interface UseScrollDirectionOptions {
  forceVisible?: boolean
}

interface UseScrollDirectionReturn {
  isVisible: boolean
}

export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): UseScrollDirectionReturn {
  const { forceVisible = false } = options
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)
  const cumulativeDelta = useRef(0)

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY

    // Always visible at page top
    if (currentScrollY <= 0) {
      setIsVisible(true)
      lastScrollY.current = 0
      cumulativeDelta.current = 0
      return
    }

    const delta = currentScrollY - lastScrollY.current

    if (delta < 0) {
      // Scrolling up — show immediately
      setIsVisible(true)
      cumulativeDelta.current = 0
    } else if (delta > 0) {
      // Scrolling down — accumulate delta, hide after threshold
      cumulativeDelta.current += delta
      if (cumulativeDelta.current >= HIDE_THRESHOLD) {
        setIsVisible(false)
      }
    }

    lastScrollY.current = currentScrollY
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  if (forceVisible) {
    return { isVisible: true }
  }

  return { isVisible }
}
