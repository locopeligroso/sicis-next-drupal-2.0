import { Typography } from "@/components/composed/Typography"

export interface SpecListingHeaderProps {
  title: string
  description?: string | null
}

export function SpecListingHeader({ title, description }: SpecListingHeaderProps) {
  return (
    <section className="flex flex-col gap-2 pt-(--spacing-element) pb-(--spacing-section)">
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
