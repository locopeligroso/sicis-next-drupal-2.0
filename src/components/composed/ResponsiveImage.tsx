import { AspectRatio } from "@/components/ui/aspect-ratio"
import { cn } from "@/lib/utils"

interface ResponsiveImageProps {
  src: string
  alt: string
  ratio?: number
  className?: string
}

export function ResponsiveImage({
  src,
  alt,
  ratio = 1,
  className,
}: ResponsiveImageProps) {
  return (
    <AspectRatio ratio={ratio} className={cn("overflow-hidden rounded-lg bg-muted", className)}>
      <img
        src={src}
        alt={alt}
        className="size-full object-cover"
      />
    </AspectRatio>
  )
}
