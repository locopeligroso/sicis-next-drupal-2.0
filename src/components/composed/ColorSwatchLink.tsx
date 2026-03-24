import Link from "next/link"

import { Typography } from "@/components/composed/Typography"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ColorSwatchLinkProps {
  href: string
  label: string
  imageUrl?: string | null
  cssColor?: string | null
  isActive?: boolean
  className?: string
}

export function ColorSwatchLink({
  href,
  label,
  imageUrl,
  cssColor,
  isActive,
  className,
}: ColorSwatchLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-opacity hover:opacity-80",
              className,
            )}
          />
        }
      >
        <span
          className={cn(
            "size-20 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(128,128,128,0.25),0_0_0_1px_rgba(128,128,128,0.15)]",
            !imageUrl && !cssColor && "bg-muted",
            isActive && "ring-2 ring-primary ring-offset-2",
          )}
          style={
            imageUrl
              ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : cssColor
                ? { backgroundColor: cssColor }
                : undefined
          }
        />
        <Typography textRole="caption" as="span" className="max-w-20 truncate text-center text-muted-foreground">
          {label}
        </Typography>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
