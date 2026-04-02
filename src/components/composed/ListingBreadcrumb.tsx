"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FILTER_REGISTRY } from "@/domain/filters/registry"

// ── Static maps ────────────────────────────────────────────────────────────

const PRODUCTS_PATH: Record<string, string> = {
  it: "/it/prodotti",
  en: "/en/products",
  fr: "/fr/produits",
  de: "/de/produkte",
  es: "/es/productos",
  ru: "/ru/продукция",
}

/** The 5 product categories shown in the dropdown (Pixall excluded). */
const CATEGORY_TYPES = [
  "prodotto_mosaico",
  "prodotto_vetrite",
  "prodotto_arredo",
  "prodotto_illuminazione",
  "prodotto_tessuto",
] as const

/**
 * Maps content type to translation namespace + key for the human-readable label.
 * Uses nav.* for most categories, products.lighting for illuminazione.
 */
const CATEGORY_LABEL_KEYS: Record<string, { ns: "nav" | "products"; key: string }> = {
  prodotto_mosaico: { ns: "nav", key: "mosaico" },
  prodotto_vetrite: { ns: "nav", key: "vetrite" },
  prodotto_arredo: { ns: "nav", key: "arredo" },
  prodotto_illuminazione: { ns: "products", key: "lighting" },
  prodotto_tessuto: { ns: "nav", key: "tessuto" },
}

// ── Component ──────────────────────────────────────────────────────────────

interface ListingBreadcrumbProps {
  locale: string
  activeCategory: string
  subcategoryLabel?: string
}

export function ListingBreadcrumb({
  locale,
  activeCategory,
  subcategoryLabel,
}: ListingBreadcrumbProps) {
  const tBreadcrumb = useTranslations("breadcrumb")
  const tNav = useTranslations("nav")
  const tProducts = useTranslations("products")

  function getCategoryLabel(contentType: string): string {
    const mapping = CATEGORY_LABEL_KEYS[contentType]
    if (!mapping) return contentType
    return mapping.ns === "nav" ? tNav(mapping.key) : tProducts(mapping.key)
  }

  function getCategoryHref(contentType: string): string {
    const config = FILTER_REGISTRY[contentType]
    if (!config) return "#"
    const basePath = config.basePaths[locale] ?? config.basePaths.it
    return `/${locale}/${basePath}`
  }

  const activeCategoryLabel = getCategoryLabel(activeCategory)

  return (
    <Breadcrumb className="pb-(--spacing-element)">
      <BreadcrumbList>
        {/* Products link */}
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={PRODUCTS_PATH[locale] ?? PRODUCTS_PATH.it} />}>
            {tBreadcrumb("filterAndFind")}
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {/* Category with dropdown */}
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="transition-colors hover:text-foreground">
              {activeCategoryLabel}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {CATEGORY_TYPES.map((type) => (
                <DropdownMenuItem
                  key={type}
                  className={type === activeCategory ? "font-semibold text-foreground" : ""}
                  render={<Link href={getCategoryHref(type)} />}
                >
                  {getCategoryLabel(type)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>

        {/* Optional subcategory */}
        {subcategoryLabel && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{subcategoryLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
