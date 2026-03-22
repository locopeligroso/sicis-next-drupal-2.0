import { Typography } from "@/components/composed/Typography"
import { Card, CardContent } from "@/components/ui/card"
import { DownloadIcon, PlayIcon, ExternalLinkIcon, BookOpenIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DocumentCardItem {
  title: string
  type?: string
  imageSrc?: string | null
  href?: string | null
  downloadLabel?: string
}

function getActionFromHref(href: string | null | undefined) {
  if (!href) return { label: "Scopri", icon: ExternalLinkIcon }
  if (/youtube|vimeo/i.test(href)) return { label: "Guarda video", icon: PlayIcon }
  if (/\.pdf(\?|$)/i.test(href)) return { label: "Download PDF", icon: DownloadIcon }
  if (/catalog|library/i.test(href)) return { label: "Sfoglia catalogo", icon: BookOpenIcon }
  return { label: "Scopri", icon: ExternalLinkIcon }
}

interface DocumentCardProps {
  item: DocumentCardItem
  layout?: "vertical" | "horizontal"
  className?: string
}

export function DocumentCard({ item, layout = "vertical", className }: DocumentCardProps) {
  const Wrapper = item.href ? "a" : "div"
  const wrapperProps = item.href
    ? { href: item.href, target: "_blank" as const, rel: "noopener noreferrer" }
    : {}

  const isHorizontal = layout === "horizontal"
  const action = item.downloadLabel
    ? { label: item.downloadLabel, icon: getActionFromHref(item.href).icon }
    : getActionFromHref(item.href)
  const ActionIcon = action.icon

  return (
    <Card className={cn("overflow-hidden group transition-shadow hover:shadow-lg p-0 gap-0", className)}>
      <Wrapper
        {...wrapperProps}
        className={cn(isHorizontal ? "flex flex-row" : "block")}
      >
        {/* Cover image */}
        {item.imageSrc ? (
          <div className={cn(
            "overflow-hidden bg-surface-2",
            isHorizontal ? "w-32 md:w-40 shrink-0" : "aspect-square",
          )}>
            <img
              src={item.imageSrc}
              alt={item.title}
              className={cn(
                "size-full object-cover transition-transform duration-300 group-hover:scale-105",
                isHorizontal && "aspect-square",
              )}
            />
          </div>
        ) : (
          <div className={cn(
            "bg-surface-2 flex items-center justify-center",
            isHorizontal ? "w-32 md:w-40 shrink-0 aspect-square" : "aspect-square",
          )}>
            <ActionIcon className="size-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Content */}
        <CardContent className={cn(
          "flex flex-col gap-1.5",
          isHorizontal ? "justify-center p-5 md:p-6" : "p-4",
        )}>
          {item.type && (
            <Typography textRole="overline" className="text-muted-foreground">
              {item.type}
            </Typography>
          )}
          <Typography textRole="body-md" className="font-semibold leading-snug">
            {item.title}
          </Typography>
          <span className="text-primary-text text-sm font-medium group-hover:underline inline-flex items-center gap-1.5 mt-1">
            <ActionIcon className="size-3.5" />
            {action.label}
          </span>
        </CardContent>
      </Wrapper>
    </Card>
  )
}
