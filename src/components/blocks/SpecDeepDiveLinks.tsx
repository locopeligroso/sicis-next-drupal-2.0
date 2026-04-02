import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import type { SecondaryLink } from "@/lib/navbar/types"
import { HubSection } from "@/components/composed/HubSection"
import { Typography } from "@/components/composed/Typography"

interface SpecDeepDiveLinksProps {
  links: SecondaryLink[]
}

export async function SpecDeepDiveLinks({ links }: SpecDeepDiveLinksProps) {
  if (links.length === 0) return null

  const tHub = await getTranslations("hub")

  return (
    <section className="max-w-main mx-auto px-(--spacing-page)">
      <HubSection title={tHub("deepDives")}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {links.map((link) => (
            <Link
              key={link.url}
              href={link.url}
              className="flex items-center gap-3 rounded-lg border border-border p-(--spacing-element) transition-colors hover:bg-accent"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <ArrowUpRight className="size-5 text-muted-foreground" />
              </div>
              <Typography
                textRole="body-sm"
                as="span"
                className="truncate font-medium text-foreground"
              >
                {link.title}
              </Typography>
            </Link>
          ))}
        </div>
      </HubSection>
    </section>
  )
}
