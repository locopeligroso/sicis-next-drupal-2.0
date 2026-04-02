import { Typography } from "@/components/composed/Typography"
import type { TextRole } from "@/components/composed/Typography"
import { cn } from "@/lib/utils"

interface HubSectionProps {
  title: string
  titleRole?: TextRole
  separator?: boolean
  children: React.ReactNode
  className?: string
}

export function HubSection({ title, titleRole = "h2", separator = true, children, className }: HubSectionProps) {
  const as = titleRole === "overline" ? "span" : "h2"

  return (
    <section className={cn("flex flex-col gap-(--spacing-element)", className)}>
      <Typography textRole={titleRole} as={as}>
        {title}
      </Typography>
      {separator && <hr className="border-t border-border" />}
      {children}
    </section>
  )
}
