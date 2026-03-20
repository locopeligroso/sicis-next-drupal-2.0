import { Typography } from "@/components/composed/Typography"
import { Card, CardContent } from "@/components/ui/card"
import { DownloadIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DocumentCardItem {
  title: string
  type?: string
  imageSrc?: string | null
  href?: string | null
  downloadLabel?: string
}

interface DocumentCardProps {
  item: DocumentCardItem
  className?: string
}

export function DocumentCard({ item, className }: DocumentCardProps) {
  const Wrapper = item.href ? "a" : "div"
  const wrapperProps = item.href
    ? { href: item.href, target: "_blank" as const, rel: "noopener noreferrer" }
    : {}

  return (
    <Card className={cn("overflow-hidden group transition-shadow hover:shadow-lg p-0 gap-0", className)}>
      <Wrapper {...wrapperProps} className="block">
        {/* Cover image */}
        {item.imageSrc ? (
          <div className="aspect-square overflow-hidden">
            <img
              src={item.imageSrc}
              alt={item.title}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="aspect-square bg-surface-2 flex items-center justify-center">
            <DownloadIcon className="size-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Content */}
        <CardContent className="flex flex-col gap-1.5 p-4">
          {item.type && (
            <Typography textRole="overline" className="text-muted-foreground">
              {item.type}
            </Typography>
          )}
          <Typography textRole="body-md" className="font-semibold leading-snug">
            {item.title}
          </Typography>
          <span className="text-primary-text text-sm font-medium group-hover:underline inline-flex items-center gap-1.5 mt-1">
            <DownloadIcon className="size-3.5" />
            {item.downloadLabel ?? "Download PDF"}
          </span>
        </CardContent>
      </Wrapper>
    </Card>
  )
}
