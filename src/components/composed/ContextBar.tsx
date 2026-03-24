"use client"

import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ChevronDown, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Typography } from "@/components/composed/Typography"
import { ShareButton } from "@/components/composed/ShareButton"

interface ContextBarProps {
  thumbnail?: string | null
  swatchColor?: string | null
  title: string
  subtitle: string
  changePopoverContent: React.ReactNode
  backHref: string
}

export function ContextBar({
  thumbnail,
  swatchColor,
  title,
  subtitle,
  changePopoverContent,
  backHref,
}: ContextBarProps) {
  const t = useTranslations("breadcrumb")

  return (
    <div className="flex items-center gap-3 border-b border-border pb-3 mb-3">
      {/* Thumbnail or swatch */}
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={title}
          width={48}
          height={48}
          className="size-12 rounded-full object-cover"
        />
      ) : swatchColor ? (
        <div
          className="size-12 shrink-0 rounded-full"
          style={{ backgroundColor: swatchColor }}
        />
      ) : null}

      {/* Title + subtitle */}
      <div className="min-w-0">
        <Typography textRole="body-lg" as="p" className="truncate font-bold text-foreground">
          {title}
        </Typography>
        <Typography textRole="body-sm" as="p" className="truncate text-muted-foreground">
          {subtitle}
        </Typography>
      </div>

      {/* Vertical separator */}
      <Separator orientation="vertical" className="h-7" />

      {/* Change popover */}
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm">
              {t("change")}
              <ChevronDown className="size-4" />
            </Button>
          }
        />
        <PopoverContent align="start">{changePopoverContent}</PopoverContent>
      </Popover>

      {/* Close / back link */}
      <Button variant="ghost" size="icon" render={<Link href={backHref} />}>
        <X className="size-4" />
      </Button>

      {/* Spacer to push ShareButton to the right */}
      <div className="ml-auto">
        <ShareButton />
      </div>
    </div>
  )
}
