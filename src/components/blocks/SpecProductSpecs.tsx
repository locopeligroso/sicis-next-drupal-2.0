import { Typography } from "@/components/composed/Typography"
import { SpecsTable, type SpecsRow } from "@/components/composed/SpecsTable"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WrenchIcon, FileTextIcon } from "lucide-react"

export interface SpecProductSpecsProps {
  title?: string
  collectionName?: string
  specs?: SpecsRow[]
  assemblyLabel?: string
  assemblyValue?: string
  assemblyImageSrc?: string | null
  groutingLabel?: string
  groutingValue?: string
  groutingImageSrc?: string | null
  groutConsumption?: string
  maintenanceLabel?: string
  maintenanceHtml?: string
  maintenanceGuideHref?: string
  maintenanceGuideLabel?: string
}

export function SpecProductSpecs({
  title = "Technical sheet",
  collectionName,
  specs = [],
  assemblyLabel = "Assembly",
  assemblyValue,
  assemblyImageSrc,
  groutingLabel = "Grouting",
  groutingValue,
  groutingImageSrc,
  groutConsumption,
  maintenanceLabel = "Maintenance and installation",
  maintenanceHtml,
  maintenanceGuideHref,
  maintenanceGuideLabel = "View guide",
}: SpecProductSpecsProps) {
  const hasCards = assemblyValue || groutingValue || maintenanceHtml
  const hasContent = specs.length > 0 || hasCards
  if (!hasContent) return null

  return (
    <section className="bg-surface-1 py-(--spacing-section)">
      <div className="max-w-main mx-auto px-(--spacing-page) flex flex-col gap-(--spacing-content)">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <Typography textRole="h2">{title}</Typography>
          {collectionName && (
            <Typography textRole="body-sm" className="text-muted-foreground">{collectionName}</Typography>
          )}
        </div>

        {/* Info cards: Assembly + Grouting + Maintenance */}
        {hasCards && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-(--spacing-element)">
            {assemblyValue && (
              <Card>
                <CardContent className="flex items-start gap-4">
                  {assemblyImageSrc ? (
                    <img src={assemblyImageSrc} alt={assemblyValue} className="size-20 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="size-20 shrink-0 rounded-lg bg-surface-2 flex items-center justify-center">
                      <WrenchIcon className="size-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <Typography textRole="subtitle-2" className="font-semibold">{assemblyLabel}</Typography>
                    <Typography textRole="body-sm" className="text-muted-foreground">{assemblyValue}</Typography>
                  </div>
                </CardContent>
              </Card>
            )}

            {groutingValue && (
              <Card>
                <CardContent className="flex items-start gap-4">
                  {groutingImageSrc ? (
                    <img src={groutingImageSrc} alt={groutingValue} className="size-20 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="size-20 shrink-0 rounded-lg bg-surface-2 flex items-center justify-center">
                      <WrenchIcon className="size-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <Typography textRole="subtitle-2" className="font-semibold">{groutingLabel}</Typography>
                    <Typography textRole="body-sm" className="text-muted-foreground">{groutingValue}</Typography>
                    {groutConsumption && (
                      <Typography textRole="caption" className="text-muted-foreground">{groutConsumption}</Typography>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {maintenanceHtml && (
              <Card>
                <CardContent className="flex flex-col gap-2">
                    <Typography textRole="subtitle-2" className="font-semibold">{maintenanceLabel}</Typography>
                    <div
                      className="text-muted-foreground text-sm leading-relaxed text-pretty"
                      dangerouslySetInnerHTML={{ __html: maintenanceHtml }}
                    />
                    {maintenanceGuideHref && (
                      <Button variant="outline" size="sm" nativeButton={false} render={<a href={maintenanceGuideHref} target="_blank" rel="noopener noreferrer" />}>
                        <FileTextIcon data-icon="inline-start" />
                        {maintenanceGuideLabel}
                      </Button>
                    )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Technical sheet grid */}
        {specs.length > 0 && (
          <SpecsTable rows={specs} />
        )}
      </div>
    </section>
  )
}
