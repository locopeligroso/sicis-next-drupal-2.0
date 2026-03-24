import { Typography } from "@/components/composed/Typography"
import { cn } from "@/lib/utils"

interface HubSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function HubSection({ title, children, className }: HubSectionProps) {
  return (
    <section className={cn("flex flex-col gap-(--spacing-element)", className)}>
      <Typography textRole="h2" as="h2">
        {title}
      </Typography>
      <hr className="border-t border-border" />
      {children}
    </section>
  )
}
