import { ResponsiveImage } from "@/components/composed/ResponsiveImage"
import { Typography } from "@/components/composed/Typography"

export interface ProductGalleryImage {
  src: string
  alt: string
}

export interface SpecProductGalleryProps {
  title?: string
  images: ProductGalleryImage[]
}

export function SpecProductGallery({
  title,
  images,
}: SpecProductGalleryProps) {
  if (images.length === 0) return null

  return (
    <section className="max-w-main mx-auto px-(--spacing-page)">
      {title && <Typography textRole="h2" className="mb-(--spacing-element)">{title}</Typography>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <ResponsiveImage key={i} src={img.src} alt={img.alt} ratio={1} />
        ))}
      </div>
    </section>
  )
}
