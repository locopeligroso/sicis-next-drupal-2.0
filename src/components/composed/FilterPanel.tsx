"use client"

import { useRef, useEffect, useCallback } from "react"

import { cn } from "@/lib/utils"

interface FilterPanelProps {
  children: React.ReactNode
  className?: string
}

/**
 * Bidirectional sticky sidebar.
 *
 * Scrolling DOWN → sidebar scrolls until bottom hits viewport bottom, locks.
 * Scrolling UP   → sidebar scrolls until top hits viewport top, locks.
 *
 * Uses translateY with cached measurements — only window.scrollY is read
 * during scroll (no getBoundingClientRect, no layout recalc in the hot path).
 */
export function FilterPanel({ children, className }: FilterPanelProps) {
  const asideRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // All mutable state in a single ref to avoid re-renders
  const s = useRef({
    offset: 0,
    asideDocTop: 0, // aside's absolute position in the document
    contentH: 0,
    asideH: 0,
  })

  /** Measure positions/sizes — only called on mount, resize, content change */
  const measure = useCallback(() => {
    const aside = asideRef.current
    const content = contentRef.current
    if (!aside || !content) return

    const rect = aside.getBoundingClientRect()
    s.current.asideDocTop = rect.top + window.scrollY
    s.current.contentH = content.offsetHeight
    s.current.asideH = aside.offsetHeight
  }, [])

  /** Scroll handler — runs synchronously, reads only scrollY */
  const onScroll = useCallback(() => {
    const content = contentRef.current
    if (!content) return

    const { asideDocTop, contentH, asideH, offset } = s.current
    const vh = window.innerHeight

    // Aside viewport position (derived from scrollY, no layout read)
    const asideVpTop = asideDocTop - window.scrollY

    // Where the content naturally sits
    const naturalVpTop = asideVpTop + offset

    // Clamp: top-of-viewport ↔ bottom-of-viewport
    const maxVp = 0
    const minVp = Math.min(maxVp, vh - contentH)
    const clampedVp = Math.max(minVp, Math.min(maxVp, naturalVpTop))

    // Convert to offset within the aside + boundary guard
    let next = clampedVp - asideVpTop
    next = Math.max(0, Math.min(asideH - contentH, next))

    if (next !== s.current.offset) {
      s.current.offset = next
      content.style.transform = `translateY(${next}px)`
    }
  }, [])

  useEffect(() => {
    measure()
    onScroll()

    const remeasure = () => { measure(); onScroll() }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", remeasure)

    const observer = new ResizeObserver(remeasure)
    if (contentRef.current) observer.observe(contentRef.current)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", remeasure)
      observer.disconnect()
    }
  }, [measure, onScroll])

  return (
    <aside
      ref={asideRef}
      className={cn(
        "w-[300px] shrink-0 border-r border-border bg-surface-1 -mt-[92px]",
        className,
      )}
    >
      <div
        ref={contentRef}
        className="min-h-screen px-(--spacing-content) pb-4 pt-[140px] will-change-transform"
      >
        {children}
      </div>
    </aside>
  )
}
