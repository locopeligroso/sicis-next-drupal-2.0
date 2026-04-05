import { getTranslations } from 'next-intl/server';
import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';
import { getTextValue, getProcessedText } from '@/lib/field-helpers';
import { getDrupalImageUrl } from '@/lib/drupal/image';
import { resolveImage } from '@/lib/api/client';
import type { ResolvedImage } from '@/lib/api/client';
import { sanitizeHtml } from '@/lib/sanitize';
import { getFilterConfig } from '@/domain/filters/registry';
import { DevBlockOverlay } from '@/components/composed/DevBlockOverlay';
import { SpecArredoHero } from '@/components/blocks/SpecArredoHero';
import { GenGallery, type GenGallerySlide } from '@/components/blocks/GenGallery';
import { SpecProductResources } from '@/components/blocks/SpecProductResources';
import {
  SpecProductTechnicalArea,
  type TechnicalAreaResource,
  type TechnicalAreaFinituraSwatch,
} from '@/components/blocks/SpecProductTechnicalArea';
import type { DocumentCardItem } from '@/components/composed/DocumentCard';
import { PageBreadcrumb } from '@/components/composed/PageBreadcrumb';
import { QuoteSheetProvider } from '@/components/composed/QuoteSheetProvider';
import type { ProdottoArredo as ProdottoArredoType } from '@/types/drupal/entities';

// ── Document item type ────────────────────────────────────────────────────────
interface DocItem {
  id?: string;
  field_titolo_main?: unknown;
  title?: unknown;
  field_tipologia_documento?: unknown;
  field_collegamento_esterno?: unknown;
  field_immagine?: unknown;
  field_allegato?: { entity?: { uri?: { value?: string } } };
}

// ── REST finiture arredo shapes (from arredo-product endpoint) ────────────────
interface FinituraFabricShape {
  tid: number;
  name: string;
  image: ResolvedImage | null;
  variants: { tid: number; name: string; image: ResolvedImage | null }[];
}
interface FinituraCategoryShape {
  tid: number;
  name: string;
  items: FinituraFabricShape[];
}
interface FinitureArredoField {
  tessutoFiniture: FinituraCategoryShape[];
  arredoFiniture: FinituraCategoryShape[];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default async function ProdottoArredo({
  node,
  slug,
}: {
  node: Record<string, unknown>;
  slug?: string[];
}) {
  // Cast sicuro: il node-resolver passa Record<string,unknown>, ma il contenuto
  // è sempre un ProdottoArredo deserializzato da Drupal JSON:API
  const typedNode = node as ProdottoArredoType;
  const t = await getTranslations('products');

  const title = getTextValue(typedNode.field_titolo_main) || typedNode.title;
  const body = getProcessedText(typedNode.field_testo_main);
  const materiali = getProcessedText(typedNode.field_materiali);
  const locale = typedNode.langcode ?? 'it';

  // ── Arredo base path (needed early for category path fallback) ────────────
  const arredoConfig = getFilterConfig('prodotto_arredo');
  const arredoBasePath = arredoConfig?.basePaths[locale] ?? arredoConfig?.basePaths.it ?? 'arredo';

  // ── Pricing ───────────────────────────────────────────────────────────────
  // field_prezzo_eu/usa in Arredo è { value: string } | null | undefined
  const prezzoEu = typedNode.field_prezzo_eu?.value ?? null;
  const prezzoUsa = typedNode.field_prezzo_usa?.value ?? null;
  const prezzoOnDemand = false; // Arredo non ha field_prezzo_on_demand nel schema

  // ── External link ─────────────────────────────────────────────────────────
  const extLinkRaw = typedNode.field_collegamento_esterno;
  const extLink =
    typeof extLinkRaw === 'string'
      ? extLinkRaw
      : extLinkRaw && typeof extLinkRaw === 'object'
        ? ((extLinkRaw as { uri?: string }).uri ?? null)
        : null;

  // ── 3D file ───────────────────────────────────────────────────────────────
  // field_path_file_ftp non è nel schema Arredo — accesso sicuro via cast
  const ftpFiles = (typedNode as Record<string, unknown>)
    .field_path_file_ftp as string[] | string | undefined;
  const file3d = Array.isArray(ftpFiles) ? ftpFiles[0] : (ftpFiles ?? null);

  // ── Categoria parent ──────────────────────────────────────────────────────
  const categoriaData = typedNode.field_categoria;
  // Category name: from entity fields, or derive from URL slug as fallback
  const categoriaNameFromEntity =
    getTextValue(categoriaData?.field_titolo_main) ||
    ((categoriaData as Record<string, unknown> | undefined)?.title as
      | string
      | undefined) ||
    ((categoriaData as Record<string, unknown> | undefined)?.name as
      | string
      | undefined);
  // slug = ['arredo', 'letti', 'komo-bed'] → slug[1] = 'letti' → 'Letti'
  const categoriaSlug = slug && slug.length >= 3 ? slug[1] : undefined;
  const categoriaNameFromSlug = categoriaSlug
    ? categoriaSlug.charAt(0).toUpperCase() + categoriaSlug.slice(1).replace(/-/g, ' ')
    : undefined;
  const categoriaName = categoriaNameFromEntity || categoriaNameFromSlug;
  const categoriaAlias = (categoriaData as Record<string, unknown> | undefined)
    ?.path as { alias?: string } | undefined;
  const categoriaPath = categoriaAlias?.alias
    ?? (categoriaSlug ? `/${arredoBasePath}/${categoriaSlug}` : undefined);

  // ── Media ─────────────────────────────────────────────────────────────────
  const gallery = typedNode.field_gallery ?? [];
  const galleryIntro = typedNode.field_gallery_intro ?? [];

  // ── Documents ─────────────────────────────────────────────────────────────
  const documenti = (typedNode.field_documenti ?? []) as DocItem[];

  // ── Document items for SpecProductResources ──
  const documentItems: DocumentCardItem[] = documenti.map((doc) => {
    const docTitle =
      getTextValue(doc.field_titolo_main) || getTextValue(doc.title) || '';
    const docType = getTextValue(doc.field_tipologia_documento);
    const extLinkRawDoc = doc.field_collegamento_esterno;
    const docLink =
      typeof extLinkRawDoc === 'string'
        ? extLinkRawDoc
        : extLinkRawDoc && typeof extLinkRawDoc === 'object'
          ? ((extLinkRawDoc as { uri?: string }).uri ?? null)
          : null;
    const allegato = doc.field_allegato?.entity?.uri?.value ?? null;
    const href = docLink || allegato;
    const image = resolveImage(doc.field_immagine);
    return { title: docTitle, type: docType ?? undefined, image, href };
  });

  // ── Scheda tecnica URLs ──────────────────────────────────────────────────
  const schedeTecniche = (typedNode.field_scheda_tecnica ?? []) as string[];

  // ── Finiture from REST endpoint (3-level: category > fabric > variant) ──────
  const finitureArredoField = (typedNode as Record<string, unknown>)
    .field_finiture_arredo as FinitureArredoField | undefined;
  const tessutoFiniture: FinituraCategoryShape[] =
    finitureArredoField?.tessutoFiniture ?? [];
  const arredoFinitureList: FinituraCategoryShape[] =
    finitureArredoField?.arredoFiniture ?? [];
  const finitureHref = (typedNode as Record<string, unknown>)._finitureHref as
    | string
    | undefined;
  const hasFiniture =
    tessutoFiniture.length > 0 || arredoFinitureList.length > 0;

  // ── Technical area data ──────────────────────────────────────────────────
  // Build up to 4 swatches: round-robin across categories for visual variety.
  // Fabric-level field_immagine is often empty in 3-level data, so fall back
  // to the first variant's image.
  const allCategories = [...tessutoFiniture, ...arredoFinitureList];
  const finitureSwatches: TechnicalAreaFinituraSwatch[] = [];
  const maxItemsPerCat = Math.max(
    0,
    ...allCategories.map((c) => c.items.length),
  );
  outer: for (let i = 0; i < maxItemsPerCat; i++) {
    for (const cat of allCategories) {
      const fabric = cat.items[i];
      if (fabric) {
        finitureSwatches.push({
          name: fabric.name,
          image: fabric.image ?? fabric.variants[0]?.image ?? null,
        });
        if (finitureSwatches.length >= 4) break outer;
      }
    }
  }

  const finitureCount =
    tessutoFiniture.reduce(
      (sum, cat) =>
        sum + cat.items.reduce((s, fabric) => s + fabric.variants.length, 0),
      0,
    ) +
    arredoFinitureList.reduce(
      (sum, cat) =>
        sum + cat.items.reduce((s, fabric) => s + fabric.variants.length, 0),
      0,
    );

  const resources: TechnicalAreaResource[] = [
    ...schedeTecniche
      .filter((url) => typeof url === 'string' && !!url)
      .map<TechnicalAreaResource>((url) => ({
        label: t('technicalSheet'),
        href: url,
        type: 'pdf',
      })),
    ...(file3d
      ? [
          {
            label: t('download3dFile'),
            href: `/sites/default/files/${file3d}`,
            type: 'file3d' as const,
          },
        ]
      : []),
    ...(extLink
      ? [
          {
            label: t('viewOn1stDibs'),
            href: extLink,
            type: 'external' as const,
          },
        ]
      : []),
  ];

  // ── Hero image ────────────────────────────────────────────────────────────
  const heroImageSrc = getDrupalImageUrl(typedNode.field_immagine);

  // ── Breadcrumb ───────────────────────────────────────────────────────────
  const breadcrumb = slug && slug.length > 0 ? (
    <PageBreadcrumb
      slug={slug}
      locale={locale}
      lastLabel={typeof title === 'string' ? title : undefined}
    />
  ) : null;

  // ── Gallery intro slides (carousel subito dopo hero) ───────────────────────
  const galleryIntroSlides = galleryIntro
    .map((img) => {
      const resolved = resolveImage(img);
      return resolved ? ({ src: resolved.url, alt: `${title ?? ''} gallery`, width: resolved.width ?? 1200, height: resolved.height ?? 800 } satisfies GenGallerySlide) : null;
    })
    .filter((s) => s !== null);

  // ── Gallery slides ────────────────────────────────────────────────────────
  const galleryMainSlides = gallery
    .map((img) => {
      const resolved = resolveImage(img);
      return resolved ? ({ src: resolved.url, alt: `${title ?? ''} gallery`, width: resolved.width ?? 1200, height: resolved.height ?? 800 } satisfies GenGallerySlide) : null;
    })
    .filter((s) => s !== null);

  return (
    <QuoteSheetProvider productName={title ?? undefined}>
    <article className="flex flex-col gap-(--spacing-section) pb-(--spacing-section)">
      {/* ── Hero Block (DS) ─────────────────────────────────────────────────── */}
      <DevBlockOverlay name="SpecArredoHero" status="ds">
        <SpecArredoHero
          title={title ?? ''}
          breadcrumb={breadcrumb}
          category={categoriaName ?? undefined}
          categoryHref={categoriaPath ? `/${locale}${categoriaPath}` : undefined}
          description={body ? sanitizeHtml(body) : undefined}
          imageSrc={heroImageSrc}
          priceEu={prezzoEu ?? undefined}
          priceUsa={prezzoUsa ?? undefined}
          isUs={locale === 'us'}
        />
      </DevBlockOverlay>

      {/* ── Gallery Intro (DS) ─────────────────────────────────────────────── */}
      {galleryIntroSlides.length > 0 && (
        <DevBlockOverlay name="GenGallery" status="ds">
          <GenGallery slides={galleryIntroSlides} />
        </DevBlockOverlay>
      )}

      {/* ── Technical Area (DS) ───────────────────────────────────────────── */}
      {(!!materiali || (hasFiniture && !!finitureHref) || resources.length > 0) && (
        <DevBlockOverlay name="SpecProductTechnicalArea" status="ds">
          <SpecProductTechnicalArea
            title={t('technicalArea')}
            materialsHtml={materiali ? sanitizeHtml(materiali) : undefined}
            materialsLabel={t('materials')}
            finitureSwatches={finitureSwatches}
            finitureCountLabel={
              finitureCount > 0
                ? t('finishesAvailable', { count: finitureCount })
                : undefined
            }
            finitureHref={hasFiniture ? finitureHref : undefined}
            finitureLinkLabel={t('viewAllFinishes')}
            finishesLabel={t('finishes')}
            resources={resources}
            resourcesLabel={t('resources')}
          />
        </DevBlockOverlay>
      )}

      {/* ── Gallery (DS) ─────────────────────────────────────────────────── */}
      {galleryMainSlides.length > 0 && (
        <DevBlockOverlay name="GenGallery" status="ds">
          <GenGallery slides={galleryMainSlides} />
        </DevBlockOverlay>
      )}

      {/* ── Documenti (DS) ─────────────────────────────────────────────────── */}
      {documentItems.length > 0 && (
        <DevBlockOverlay name="SpecProductResources" status="ds">
          <SpecProductResources title={t('exploreCatalogs')} documents={documentItems} />
        </DevBlockOverlay>
      )}

      {/* ── Paragraph blocks (Gen) ─────────────────────────────────────────── */}
      {(
        (typedNode.field_blocchi as Record<string, unknown>[] | undefined) ?? []
      ).map((p, i) => (
        <ParagraphResolver
          key={(p.id as string) ?? i}
          paragraph={p}
          pageTitle={title ?? undefined}
        />
      ))}
    </article>
    </QuoteSheetProvider>
  );
}
