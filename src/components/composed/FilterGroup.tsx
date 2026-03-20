"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Typography } from "@/components/composed/Typography"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface FilterGroupProps {
  label: string
  priority: "P0" | "P1" | "P2"
  defaultExpanded?: boolean
  children: React.ReactNode
}

export function FilterGroup({
  label,
  priority,
  defaultExpanded,
  children,
}: FilterGroupProps) {
  const isOpen = defaultExpanded ?? priority !== "P2"

  return (
    <Collapsible defaultOpen={isOpen} className="flex flex-col gap-3">
      <CollapsibleTrigger className="flex w-full items-center justify-between">
        <Typography textRole="overline" as="span" className="text-muted-foreground">
          {label}
        </Typography>
        <ChevronDown className={cn(
          "size-4 text-muted-foreground transition-transform",
          "group-data-[panel-open]:rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}
