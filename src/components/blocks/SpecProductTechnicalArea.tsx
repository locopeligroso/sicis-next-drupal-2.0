import Image from 'next/image';
import Link from 'next/link';
import {
  LayersIcon,
  PaletteIcon,
  FolderOpenIcon,
  DownloadIcon,
  BoxIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
} from 'lucide-react';
import { Typography } from '@/components/composed/Typography';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ResolvedImage } from '@/lib/api/client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TechnicalAreaResource {
  label: string;
  href: string;
  type: 'pdf' | 'file3d' | 'external';
}

export interface TechnicalAreaFinituraSwatch {
  name: string;
  image: ResolvedImage | null;
}

export interface SpecProductTechnicalAreaProps {
  title: string;
  /** Materials HTML (must already be sanitized) */
  materialsHtml?: string | null;
  materialsLabel: string;
  /** Up to 4 swatches shown as preview */
  finitureSwatches?: TechnicalAreaFinituraSwatch[];
  /** Pre-rendered localised count label (e.g. "57 finiture disponibili") */
  finitureCountLabel?: string;
  /** URL to the dedicated finiture page */
  finitureHref?: string | null;
  finitureLinkLabel: string;
  finishesLabel: string;
  /** List of downloadable/external resources */
  resources?: TechnicalAreaResource[];
  resourcesLabel: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resourceIcon(type: TechnicalAreaResource['type']) {
  switch (type) {
    case 'pdf':
      return DownloadIcon;
    case 'file3d':
      return BoxIcon;
    case 'external':
      return ExternalLinkIcon;
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function SpecProductTechnicalArea({
  title,
  materialsHtml,
  materialsLabel,
  finitureSwatches,
  finitureCountLabel,
  finitureHref,
  finitureLinkLabel,
  finishesLabel,
  resources,
  resourcesLabel,
}: SpecProductTechnicalAreaProps) {
  const hasMaterials = !!materialsHtml;
  const hasFinitureData =
    !!finitureCountLabel || (!!finitureSwatches && finitureSwatches.length > 0);
  const showFiniture = !!finitureHref && hasFinitureData;
  const showResources = !!resources && resources.length > 0;
  const cardCount = [hasMaterials, showFiniture, showResources].filter(Boolean).length;

  if (cardCount === 0) return null;

  return (
    <section className="bg-surface-1 py-(--spacing-section)">
      <div className="max-w-main mx-auto px-(--spacing-page) flex flex-col gap-(--spacing-content)">
        <Typography textRole="h2">{title}</Typography>

        <div
          className={cn(
            'grid gap-(--spacing-element)',
            cardCount === 1 && 'grid-cols-1 md:max-w-lg',
            cardCount === 2 && 'grid-cols-1 md:grid-cols-2',
            cardCount === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          )}
        >
          {materialsHtml && (
            <MaterialsCard label={materialsLabel} html={materialsHtml} />
          )}
          {finitureHref && hasFinitureData && (
            <FinitureCard
              label={finishesLabel}
              swatches={finitureSwatches}
              countLabel={finitureCountLabel}
              href={finitureHref}
              linkLabel={finitureLinkLabel}
            />
          )}
          {resources && resources.length > 0 && (
            <ResourcesCard label={resourcesLabel} items={resources} />
          )}
        </div>
      </div>
    </section>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function CardHead({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-8 shrink-0 rounded-md bg-surface-2 flex items-center justify-center">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <Typography textRole="subtitle-2" className="font-semibold">
        {label}
      </Typography>
    </div>
  );
}

function MaterialsCard({ label, html }: { label: string; html: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <CardHead icon={LayersIcon} label={label} />
        <div
          className="text-sm text-muted-foreground leading-relaxed text-pretty [&_p]:m-0 [&_p+p]:mt-2"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </CardContent>
    </Card>
  );
}

function FinitureCard({
  label,
  swatches,
  countLabel,
  href,
  linkLabel,
}: {
  label: string;
  swatches?: TechnicalAreaFinituraSwatch[];
  countLabel?: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-col gap-3 grow">
        <CardHead icon={PaletteIcon} label={label} />
        {swatches && swatches.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {swatches.slice(0, 4).map((s, i) => (
              <Tooltip key={i}>
                <TooltipTrigger
                  render={
                    <div
                      tabIndex={0}
                      className="relative aspect-square overflow-hidden rounded-md bg-surface-2 ring-1 ring-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    />
                  }
                >
                  {s.image?.url && (
                    <Image
                      src={s.image.url}
                      alt={s.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </TooltipTrigger>
                <TooltipContent>{s.name}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
        {countLabel && (
          <Typography textRole="body-sm" className="text-muted-foreground">
            {countLabel}
          </Typography>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          className="w-full"
          render={<Link href={href} />}
        >
          {linkLabel}
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function ResourcesCard({
  label,
  items,
}: {
  label: string;
  items: TechnicalAreaResource[];
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <CardHead icon={FolderOpenIcon} label={label} />
        <ul className="flex flex-col gap-2">
          {items.map((r, i) => {
            const Icon = resourceIcon(r.type);
            return (
              <li key={i}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary-text"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary-text" />
                  <span className="truncate underline decoration-transparent underline-offset-(--underline-offset) group-hover:decoration-current">
                    {r.label}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
