import { Typography } from "@/components/composed/Typography"
import type { BreadcrumbSegment } from "@/components/composed/SmartBreadcrumb"
import { SmartBreadcrumb } from "@/components/composed/SmartBreadcrumb"

export interface SpecListingHeaderProps {
  title: string
  description?: string | null
  breadcrumbSegments?: BreadcrumbSegment[]
}

export function SpecListingHeader({ title, description, breadcrumbSegments }: SpecListingHeaderProps) {
  return (
    <section className="max-w-main mx-auto px-(--spacing-page) flex flex-col gap-2 pt-(--spacing-navbar)">
        {breadcrumbSegments && breadcrumbSegments.length > 0 && (
          <SmartBreadcrumb segments={breadcrumbSegments} />
        )}
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
