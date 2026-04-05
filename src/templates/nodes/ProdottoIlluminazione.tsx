import { getTranslations } from 'next-intl/server';
import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';
import { getTextValue, getProcessedText } from '@/lib/field-helpers';
import { getDrupalImageUrl } from '@/lib/drupal/image';
import { resolveImage } from '@/lib/api/client';
import { sanitizeHtml } from '@/lib/sanitize';
import { getFilterConfig } from '@/domain/filters/registry';
import { DevBlockOverlay } from '@/components/composed/DevBlockOverlay';
import { SpecArredoHero } from '@/components/blocks/SpecArredoHero';
import { GenGallery, type GenGallerySlide } from '@/components/blocks/GenGallery';
import { SpecProductResources } from '@/components/blocks/SpecProductResources';
import { SpecProductTechnicalArea } from '@/components/blocks/SpecProductTechnicalArea';
import type { TechnicalAreaResource } from '@/components/blocks/SpecProductTechnicalArea';
import type { DocumentCardItem } from '@/components/composed/DocumentCard';
import { PageBreadcrumb } from '@/components/composed/PageBreadcrumb';
import { QuoteSheetProvider } from '@/components/composed/QuoteSheetProvider';
import type { ProdottoIlluminazione as ProdottoIlluminazioneType } from '@/types/drupal/entities';

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

// ── Component ─────────────────────────────────────────────────────────────────
export default async function ProdottoIlluminazione({
  node,
  slug,
}: {
  node: Record<string, unknown>;
  slug?: string[];
}) {
  // Cast sicuro: il node-resolver passa Record<string,unknown>, ma il contenuto
  // è sempre un ProdottoIlluminazione deserializzato dall'adapter legacy
  const typedNode = node as ProdottoIlluminazioneType;
  const t = await getTranslations('products');

  const title = getTextValue(typedNode.field_titolo_main) || typedNode.title;
  const body = getProcessedText(typedNode.field_testo_main);
  const materiali = getProcessedText(typedNode.field_materiali);
  const specifiche = getProcessedText(typedNode.field_specifiche_tecniche);
  const locale = typedNode.langcode ?? 'it';

  // ── Illuminazione base path (needed early for category path fallback) ─────
  const illumConfig = getFilterConfig('prodotto_illuminazione');
  const illumBasePath =
    illumConfig?.basePaths[locale] ?? illumConfig?.basePaths.it ?? 'illuminazione';

  // ── Pricing ───────────────────────────────────────────────────────────────
  const prezzoEu = typedNode.field_prezzo_eu?.value ?? null;
  const prezzoUsa = typedNode.field_prezzo_usa?.value ?? null;

  // ── External link ─────────────────────────────────────────────────────────
  const extLinkRaw = typedNode.field_collegamento_esterno;
  const extLink =
    typeof extLinkRaw === 'string'
      ? extLinkRaw
      : extLinkRaw && typeof extLinkRaw === 'object'
        ? ((extLinkRaw as { uri?: string }).uri ?? null)
        : null;

  // ── 3D file ───────────────────────────────────────────────────────────────
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
  // slug = ['illuminazione', 'lampadari', 'ballet-chandelier'] → slug[1] = 'lampadari'
  const categoriaSlug = slug && slug.length >= 3 ? slug[1] : undefined;
  const categoriaNameFromSlug = categoriaSlug
    ? categoriaSlug.charAt(0).toUpperCase() + categoriaSlug.slice(1).replace(/-/g, ' ')
    : undefined;
  const categoriaName = categoriaNameFromEntity || categoriaNameFromSlug;
  const categoriaAlias = (categoriaData as Record<string, unknown> | undefined)
    ?.path as { alias?: string } | undefined;
  const categoriaPath = categoriaAlias?.alias
    ?? (categoriaSlug ? `/${illumBasePath}/${categoriaSlug}` : undefined);

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

  // ── Technical area resources (scheda tecnica + 3D + external link) ───────
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
      {(!!materiali || !!specifiche || resources.length > 0) && (
        <DevBlockOverlay name="SpecProductTechnicalArea" status="ds">
          <SpecProductTechnicalArea
            title={t('technicalArea')}
            materialsHtml={materiali ? sanitizeHtml(materiali) : undefined}
            materialsLabel={t('materials')}
            specsHtml={specifiche ? sanitizeHtml(specifiche) : undefined}
            specsLabel={t('technicalSpecs')}
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

      {/* ── Paragraph blocks (Gen) — forward-compat, empty until Freddi enriches endpoint ── */}
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
