'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// ── Local interfaces (mirror arredo-product.ts exports without importing from server module) ──

export interface FinituraVariant {
  tid: number;
  name: string;
  imageUrl: string | null;
}

export interface FinituraTessuto {
  tid: number;
  name: string;
  imageUrl: string | null;
  variants: FinituraVariant[];
}

export interface FinituraCategory {
  tid: number;
  name: string;
  items: FinituraTessuto[];
}

export interface FinitureGalleryProps {
  categories: FinituraCategory[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_VISIBLE = 8;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Strip the fabric prefix from a variant name.
 * "Ares - Cream" under fabric "Ares" → "Cream"
 * Falls back to the full name if no match.
 */
function stripFabricPrefix(variantName: string, fabricName: string): string {
  const prefix = `${fabricName} - `;
  if (variantName.startsWith(prefix)) {
    return variantName.slice(prefix.length);
  }
  // Also try without space around dash
  const prefixTight = `${fabricName}-`;
  if (variantName.startsWith(prefixTight)) {
    return variantName.slice(prefixTight.length).trimStart();
  }
  return variantName;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface SwatchProps {
  variant: FinituraVariant;
  label: string;
}

function Swatch({ variant, label }: SwatchProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
        {variant.imageUrl ? (
          <Image
            src={variant.imageUrl}
            alt={variant.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-surface-3" aria-hidden="true" />
        )}
      </div>
      <span className="text-[11px] text-muted-foreground leading-snug tracking-wide">
        {label}
      </span>
    </div>
  );
}

interface FabricSectionProps {
  fabric: FinituraTessuto;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function FabricSection({
  fabric,
  isExpanded,
  onToggleExpand,
}: FabricSectionProps) {
  const visibleVariants = isExpanded
    ? fabric.variants
    : fabric.variants.slice(0, INITIAL_VISIBLE);
  const hiddenCount = fabric.variants.length - INITIAL_VISIBLE;
  const hasMore = !isExpanded && hiddenCount > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Fabric sub-section header — "K - KENDAL" style */}
      <h4 className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {fabric.name}
      </h4>

      {/* Swatch grid — 2 cols mobile, 4 cols tablet+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5">
        {visibleVariants.map((variant) => (
          <Swatch
            key={variant.tid}
            variant={variant}
            label={stripFabricPrefix(variant.name, fabric.name)}
          />
        ))}
      </div>

      {/* Expand / collapse — Molteni-style: uppercase, small, bordered */}
      {(hasMore || isExpanded) && (
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          className={cn(
            'self-start mt-1 px-4 py-1.5',
            'text-[11px] font-medium uppercase tracking-[0.12em]',
            'border border-border text-muted-foreground',
            'hover:border-foreground hover:text-foreground transition-colors',
          )}
        >
          {isExpanded
            ? 'Mostra meno'
            : `Vedi tutti (${fabric.variants.length})`}
        </button>
      )}
    </div>
  );
}

interface CategorySectionProps {
  category: FinituraCategory;
  expandedTids: Set<number>;
  onToggleExpand: (tid: number) => void;
}

function CategorySection({
  category,
  expandedTids,
  onToggleExpand,
}: CategorySectionProps) {
  return (
    <section
      id={`cat-${category.tid}`}
      className="flex flex-col gap-8 scroll-mt-32"
      aria-labelledby={`cat-heading-${category.tid}`}
    >
      {/* Category heading */}
      <h3
        id={`cat-heading-${category.tid}`}
        className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground border-b border-border pb-2"
      >
        {category.name}
      </h3>

      {category.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nessuna finitura disponibile.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {category.items.map((fabric) => (
            <FabricSection
              key={fabric.tid}
              fabric={fabric}
              isExpanded={expandedTids.has(fabric.tid)}
              onToggleExpand={() => onToggleExpand(fabric.tid)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FinitureGallery({ categories }: FinitureGalleryProps) {
  const [expandedTids, setExpandedTids] = useState<Set<number>>(new Set());

  if (categories.length === 0) return null;

  function toggleExpanded(tid: number) {
    setExpandedTids((prev) => {
      const next = new Set(prev);
      if (next.has(tid)) {
        next.delete(tid);
      } else {
        next.add(tid);
      }
      return next;
    });
  }

  return (
    <div className="flex gap-10 lg:gap-16 items-start">
      {/* ── Left sidebar: sticky anchor nav ── */}
      <nav
        aria-label="Sezioni finiture"
        className="hidden md:flex flex-col gap-1 sticky top-32 shrink-0 w-40"
      >
        {categories.map((category) => (
          <a
            key={category.tid}
            href={`#cat-${category.tid}`}
            className={cn(
              'text-[11px] uppercase tracking-[0.15em] py-1',
              'text-muted-foreground hover:text-foreground transition-colors',
            )}
          >
            {category.name}
          </a>
        ))}
      </nav>

      {/* ── Main scrollable content: all categories stacked ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-14">
        {categories.map((category) => (
          <CategorySection
            key={category.tid}
            category={category}
            expandedTids={expandedTids}
            onToggleExpand={toggleExpanded}
          />
        ))}
      </div>
    </div>
  );
}
