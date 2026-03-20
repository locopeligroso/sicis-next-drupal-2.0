"use client"

import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { ResponsiveImage } from "@/components/composed/ResponsiveImage"
import { cn } from "@/lib/utils"
import { PlayIcon, ArrowLeftRightIcon } from "lucide-react"

export type ProductCarouselSlide =
  | { type: "image"; src: string; alt: string; thumbSrc?: string }
  | { type: "video"; src: string; thumbSrc?: string }
  | { type: "static"; src: string; alt: string; thumbSrc?: string }

interface ProductCarouselProps {
  slides: ProductCarouselSlide[]
  ratio?: number
  className?: string
}

export function ProductCarousel({
  slides,
  ratio = 4 / 3,
  className,
}: ProductCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (!api) return
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  return (
    <div className={cn("relative", className)}>
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent>
          {slides.map((slide, i) => (
            <CarouselItem key={i}>
              {slide.type === "video" ? (
                <AspectRatio ratio={ratio} className="overflow-hidden rounded-lg bg-muted">
                  <video
                    src={slide.src}
                    controls
                    className="size-full object-cover"
                  />
                </AspectRatio>
              ) : (
                <ResponsiveImage
                  src={slide.src}
                  alt={slide.alt}
                  ratio={ratio}
                />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="flex items-center gap-2 pt-3 p-1 overflow-x-auto md:flex-wrap md:overflow-x-visible">
          {slides.map((slide, i) => {
            const thumbSrc =
              slide.thumbSrc ??
              (slide.type === "image" ? slide.src : undefined)
            const thumbIcon =
              slide.type === "video" ? <PlayIcon className="size-5 text-muted-foreground" />
              : slide.type === "static" ? <ArrowLeftRightIcon className="size-5 text-muted-foreground" />
              : null
            return (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                  "relative shrink-0 md:shrink size-14 rounded-md overflow-hidden bg-surface-2 ring-2 ring-offset-2 ring-offset-background transition-all",
                  i === current
                    ? "ring-primary"
                    : "ring-transparent opacity-60 hover:opacity-100"
                )}
              >
                {thumbSrc ? (
                  <img
                    src={thumbSrc}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center">
                    {thumbIcon}
                  </div>
                )}
                <span className="sr-only">Slide {i + 1}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
