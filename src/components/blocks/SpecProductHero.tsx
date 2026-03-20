"use client"

import * as React from "react"
import Link from "next/link"
import { Typography } from "@/components/composed/Typography"
import { ProductCarousel, type ProductCarouselSlide } from "@/components/composed/ProductCarousel"
import { ProductCta } from "@/components/composed/ProductCta"
import { ProductPricingCard } from "@/components/composed/ProductPricingCard"
import { cn } from "@/lib/utils"
import { ArrowRightIcon } from "lucide-react"

export interface SpecProductHeroProps {
  title: string
  collection?: string
  collectionHref?: string
  description?: string
  slides: ProductCarouselSlide[]
  hasSample?: boolean
  onRequestSample?: () => void
  onGetQuote?: () => void
  price?: string | null
  priceUnit?: string
  inStock?: boolean
  shippingWarehouse?: string
  shippingTime?: string
  discoverUrl?: string
  discoverLabel?: string
}

export function SpecProductHero({
  title,
  collection,
  collectionHref,
  description,
  slides,
  hasSample = true,
  onRequestSample,
  onGetQuote,
  price,
  priceUnit,
  inStock = false,
  shippingWarehouse,
  shippingTime,
  discoverUrl,
  discoverLabel = "Scopri cosa rende i nostri Mosaici Unici",
}: SpecProductHeroProps) {
  const inFlowCtaRef = React.useRef<HTMLDivElement>(null)
  const [ctaVisible, setCtaVisible] = React.useState(false)

  React.useEffect(() => {
    const el = inFlowCtaRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const collectionLabel = collection && (
    collectionHref ? (
      <Link href={collectionHref} className="hover:underline decoration-primary-text underline-offset-(--underline-offset)">
        <Typography textRole="subtitle-2" as="span" className="text-primary-text">
          {collection}
        </Typography>
      </Link>
    ) : (
      <Typography textRole="subtitle-2" className="text-muted-foreground">
        {collection}
      </Typography>
    )
  )

  return (
    <>
      <section className="max-w-7xl mx-auto px-(--spacing-page)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-(--spacing-content) md:gap-(--spacing-section)">
          {/* Title + Collection — first on mobile */}
          <div className="flex flex-col gap-1 md:hidden">
            <Typography textRole="h1">{title}</Typography>
            {collectionLabel}
          </div>

          {/* Left: Carousel */}
          <ProductCarousel slides={slides} ratio={1} />

          {/* Right: Content */}
          <div className="flex flex-col gap-(--spacing-element)">
            {/* Title + Collection — shown on md+ */}
            <div className="hidden md:flex flex-col gap-1">
              <Typography textRole="h1">{title}</Typography>
              {collectionLabel}
            </div>

            {/* Description */}
            {description && (
              <div
                className="text-muted-foreground text-base leading-relaxed text-pretty"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}

            {/* CTAs (in-flow) */}
            <div ref={inFlowCtaRef}>
              <ProductCta
                hasSample={hasSample}
                onRequestSample={onRequestSample}
                onGetQuote={onGetQuote}
              />
            </div>

            {/* Pricing + Stock Card */}
            <ProductPricingCard
              price={price}
              priceUnit={priceUnit}
              inStock={inStock}
              shippingWarehouse={shippingWarehouse}
              shippingTime={shippingTime}
            />

            {/* Discover link */}
            {discoverUrl && (
              <a
                href={discoverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-primary-text hover:underline decoration-primary-text underline-offset-(--underline-offset)"
              >
                <Typography textRole="body-sm" as="span" className="text-primary-text">
                  {discoverLabel}
                </Typography>
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Sticky CTA bar — mobile only, hides when in-flow CTAs are visible */}
      <div
        className={cn(
          "fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-sm border-t px-(--spacing-page) py-3 md:hidden transition-transform duration-300",
          ctaVisible ? "translate-y-full" : "translate-y-0"
        )}
      >
        <ProductCta
          hasSample={hasSample}
          onRequestSample={onRequestSample}
          onGetQuote={onGetQuote}
        />
      </div>
    </>
  )
}
