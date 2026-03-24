import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowUpRight } from "lucide-react"

import { HubSection } from "@/components/composed/HubSection"
import { CategoryCard } from "@/components/composed/CategoryCard"
import { Typography } from "@/components/composed/Typography"

interface SpecHubArredoCategory {
  slug: string
  label: string
  imageUrl?: string | null
  href: string
  subtitle?: string
  count?: number
}

interface SpecHubArredoProps {
  categories: SpecHubArredoCategory[]
  basePath: string
  locale: string
  categoryCardRatio?: string // default "4/3"
}

export async function SpecHubArredo({
  categories,
  basePath,
  locale,
  categoryCardRatio = "4/3",
}: SpecHubArredoProps) {
  const tHub = await getTranslations("hub")
  const tFilters = await getTranslations("filters")

  // ── 1. Typology cards ────────────────────────────────────────────────
  const typologySection = categories.length > 0 ? (
    <section className="flex flex-col gap-(--spacing-element)">
      <Typography textRole="overline" as="h2">
        {tFilters("typologies")}
      </Typography>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.slug}
            title={cat.label}
            imageUrl={cat.imageUrl}
            href={cat.href}
            aspectRatio={categoryCardRatio}
            disabled={cat.count === 0}
          />
        ))}
      </div>
    </section>
  ) : null

  // ── 2. Scopri anche ──────────────────────────────────────────────────
  const discoverCards = [
    { slug: "custom-projects", label: "Custom Projects" },
    { slug: "showroom-visit", label: "Visit a Showroom" },
    { slug: "design-consultation", label: "Design Consultation" },
  ]

  const discoverSection = (
    <HubSection title={tHub("discoverAlso")}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {discoverCards.map((card) => (
          <CategoryCard
            key={card.slug}
            title={card.label}
            href="#"
            aspectRatio="3/2"
          />
        ))}
      </div>
    </HubSection>
  )

  // ── 3. Approfondimenti ───────────────────────────────────────────────
  const deepDiveLinks = [
    { slug: "care-guide", title: "Care Guide", subtitle: "Maintenance tips" },
    { slug: "materials", title: "Materials", subtitle: "Quality craftsmanship" },
    { slug: "catalogs", title: "Catalogs", subtitle: "Browse collections" },
  ]

  const deepDiveSection = (
    <HubSection title={tHub("deepDives")}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {deepDiveLinks.map((link) => (
          <Link
            key={link.slug}
            href="#"
            className="flex items-center gap-3 rounded-lg border border-border p-(--spacing-element) transition-colors hover:bg-accent"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <ArrowUpRight className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <Typography textRole="body-sm" as="span" className="block truncate font-medium text-foreground">
                {link.title}
              </Typography>
              <Typography textRole="caption" as="span" className="block truncate text-muted-foreground">
                {link.subtitle}
              </Typography>
            </div>
          </Link>
        ))}
      </div>
    </HubSection>
  )

  return (
    <div className="flex flex-col gap-(--spacing-section)">
      {typologySection}
      {discoverSection}
      {deepDiveSection}
    </div>
  )
}
