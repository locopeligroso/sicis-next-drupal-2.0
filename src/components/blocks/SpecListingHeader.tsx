import type * as React from "react"
import { Typography } from "@/components/composed/Typography"

export interface SpecListingHeaderProps {
  title: string
  description?: string | null
  breadcrumb?: React.ReactNode
}

export function SpecListingHeader({ title, description, breadcrumb }: SpecListingHeaderProps) {
  return (
    <section className="max-w-main mx-auto px-(--spacing-page) flex flex-col gap-2 pt-(--spacing-navbar)">
        {breadcrumb}
        <Typography textRole="h1" as="h1">
          {title}
        </Typography>
        {description && (
          <Typography textRole="body-md" as="p">
            {description}
          </Typography>
        )}
    </section>
  )
}
