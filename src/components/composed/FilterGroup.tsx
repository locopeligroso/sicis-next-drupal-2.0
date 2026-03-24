import { Typography } from "@/components/composed/Typography"

interface FilterGroupProps {
  label: string
  children: React.ReactNode
}

export function FilterGroup({ label, children }: FilterGroupProps) {
  if (!children) return null

  return (
    <div className="flex flex-col gap-3">
      <Typography textRole="overline" as="span" className="text-muted-foreground">
        {label}
      </Typography>
      {children}
    </div>
  )
}
