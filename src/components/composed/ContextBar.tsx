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
    <div className="flex items-center gap-(--spacing-element) border-b border-border pb-(--spacing-element) mb-(--spacing-content)">
      {/* Thumbnail or swatch — centered vertically with title + actions */}
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={title}
          width={64}
          height={64}
          className="size-16 shrink-0 rounded-full object-cover"
        />
      ) : swatchColor ? (
        <div
          className="size-16 shrink-0 rounded-full"
          style={{ backgroundColor: swatchColor }}
        />
      ) : null}

      {/* Title + actions below */}
      <div className="min-w-0 flex flex-col gap-1">
        <Typography textRole="h3" as="p" className="truncate text-foreground">
          {title}
        </Typography>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Spacer to push ShareButton to the right */}
      <div className="ml-auto">
        <ShareButton />
      </div>
    </div>
  )
}
