import { Typography } from "@/components/composed/Typography"
import { cn } from "@/lib/utils"

interface HubSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function HubSection({ title, children, className }: HubSectionProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <Typography textRole="overline" as="h2">
        {title}
      </Typography>
      {children}
    </section>
  )
}
