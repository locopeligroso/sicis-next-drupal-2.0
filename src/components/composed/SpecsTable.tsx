import { Typography } from "@/components/composed/Typography"
import { cn } from "@/lib/utils"

export interface SpecsRow {
  label: string
  value: string
}

interface SpecsTableProps {
  rows: SpecsRow[]
  className?: string
}

export function SpecsTable({ rows, className }: SpecsTableProps) {
  if (rows.length === 0) return null

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-t border-l border-border", className)}>
      {rows.map((row, i) => (
        <div key={i} className="border-b border-r border-border p-4 flex flex-col justify-between gap-2">
          <Typography textRole="overline" className="text-muted-foreground">
            {row.label}
          </Typography>
          <Typography textRole="body-sm" as="span" className="font-medium">
            {row.value}
          </Typography>
        </div>
      ))}
    </div>
  )
}
