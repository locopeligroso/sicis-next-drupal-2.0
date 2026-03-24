import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { HubSection } from "@/components/composed/HubSection"
import { CategoryCard } from "@/components/composed/CategoryCard"
import { Typography } from "@/components/composed/Typography"

interface SpecHubArredoCategory {
  slug: string
  label: string
  imageUrl?: string | null
  href: string
  subtitle?: string
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
    <section className="flex flex-col gap-4">
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
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <svg
                className="size-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {link.title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {link.subtitle}
              </span>
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
