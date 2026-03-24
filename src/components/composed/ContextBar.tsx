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
    <div className="flex items-center gap-(--spacing-element) border-b border-border bg-background mb-(--spacing-element) pb-(--spacing-element)">
      {/* Thumbnail or swatch — centered vertically with title + actions */}
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={title}
          width={64}
          height={64}
          className="size-16 shrink-0 rounded-full object-cover shadow-[inset_0_0_0_1px_rgba(128,128,128,0.25),0_0_0_1px_rgba(128,128,128,0.15)]"
        />
      ) : swatchColor ? (
        <div
          className="size-16 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(128,128,128,0.25),0_0_0_1px_rgba(128,128,128,0.15)]"
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
                  <ChevronDown data-icon="inline-end" />
                </Button>
              }
            />
            <PopoverContent align="start" className="w-64 max-h-72 overflow-y-auto">{changePopoverContent}</PopoverContent>
          </Popover>

          {/* Close / back link */}
          <Button variant="outline" size="icon-sm" nativeButton={false} render={<Link href={backHref} />}>
            <X />
          </Button>
        </div>
      </div>

      {/* Share bottom-right */}
      <div className="ml-auto self-end">
        <ShareButton />
      </div>
    </div>
  )
}
