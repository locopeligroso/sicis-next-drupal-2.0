import { Typography } from "@/components/composed/Typography"
import { DocumentCard, type DocumentCardItem } from "@/components/composed/DocumentCard"

export interface SpecProductResourcesProps {
  title?: string
  documents?: DocumentCardItem[]
  downloadLabel?: string
}

export function SpecProductResources({
  title = "Get inspired through catalogs",
  documents = [],
  downloadLabel = "Download PDF",
}: SpecProductResourcesProps) {
  if (documents.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-(--spacing-page)">
      <Typography textRole="h2" className="mb-(--spacing-element)">{title}</Typography>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-(--spacing-element)">
        {documents.map((doc, i) => (
          <DocumentCard key={i} item={{ ...doc, downloadLabel }} />
        ))}
      </div>
    </section>
  )
}
