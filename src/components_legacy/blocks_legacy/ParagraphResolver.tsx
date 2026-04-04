// ── Gen blocks (DS) ─────────────────────────────────────────────────────────
import { GenIntro } from '@/components/blocks/GenIntro';
import { GenQuote } from '@/components/blocks/GenQuote';
import { GenVideo } from '@/components/blocks/GenVideo';
import { GenTestoImmagine } from '@/components/blocks/GenTestoImmagine';
import { GenGallery } from '@/components/blocks/GenGallery';
import type { GenGallerySlide } from '@/components/blocks/GenGallery';
import { GenTestoImmagineBig } from '@/components/blocks/GenTestoImmagineBig';
import { GenTestoImmagineBlog } from '@/components/blocks/GenTestoImmagineBlog';
import { GenGalleryIntro } from '@/components/blocks/GenGalleryIntro';
import type { GenGalleryIntroSlide } from '@/components/blocks/GenGalleryIntro';
import { GenDocumenti } from '@/components/blocks/GenDocumenti';
import type { GenDocumentiItem } from '@/components/blocks/GenDocumenti';
import { GenA } from '@/components/blocks/GenA';
import { GenB } from '@/components/blocks/GenB';
import type { GenBItem } from '@/components/blocks/GenB';
import { GenC } from '@/components/blocks/GenC';
import { GenE } from '@/components/blocks/GenE';
import { getTextValue, getProcessedText } from '@/lib/field-helpers';
import { getDrupalImageUrl } from '@/lib/drupal/image';
import { resolveImage } from '@/lib/api/client';
import { DevBlockOverlay } from '@/components/composed/DevBlockOverlay';

// ── Legacy blocks (remaining — not yet migrated to Gen*) ────────────────────
import BloccoSliderHome from './BloccoSliderHome';
import BloccoCorrelati from './BloccoCorrelati';
import BloccoNewsletter from './BloccoNewsletter';
import BloccoFormBlog from './BloccoFormBlog';
import BloccoAnni from './BloccoAnni';
import BloccoTutorial from './BloccoTutorial';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParagraphComponent = (props: {
  paragraph: Record<string, unknown>;
}) => any;

const LEGACY_MAP: Record<string, ParagraphComponent> = {
  'paragraph--blocco_slider_home': BloccoSliderHome,
  'paragraph--blocco_correlati': BloccoCorrelati,
  'paragraph--blocco_newsletter': BloccoNewsletter,
  'paragraph--blocco_form_blog': BloccoFormBlog,
  'paragraph--blocco_anni': BloccoAnni,
  'paragraph--blocco_tutorial': BloccoTutorial,
};

// ── Gen adapters ────────────────────────────────────────────────────────────

function adaptGenIntro(p: Record<string, unknown>, pageTitle?: string) {
  const title = getTextValue(p.field_titolo_formattato);
  const subtitle =
    pageTitle ?? getTextValue(p.field_sopratitolo_approfondiment) ?? '';
  const bodyHtml = getProcessedText(p.field_testo);
  const resolvedImage = resolveImage(p.field_immagine);
  const imageAlt = (p.field_immagine as Record<string, unknown> | undefined)
    ?.meta
    ? (((
        (p.field_immagine as Record<string, unknown>).meta as Record<
          string,
          unknown
        >
      )?.alt as string) ?? '')
    : '';
  const linkHref =
    getTextValue(p.field_collegamento_esterno) ??
    ((p.field_collegamento_interno as Record<string, unknown> | undefined)
      ?.path as string) ??
    null;
  const linkLabel = getTextValue(p.field_label_collegamento) ?? null;

  if (!title || !bodyHtml) return null;

  return (
    <GenIntro
      title={title}
      subtitle={subtitle}
      bodyHtml={bodyHtml}
      imageSrc={resolvedImage?.url ?? undefined}
      imageWidth={resolvedImage?.width ?? null}
      imageHeight={resolvedImage?.height ?? null}
      imageAlt={imageAlt}
      linkHref={linkHref}
      linkLabel={linkLabel}
    />
  );
}

function adaptGenVideo(p: Record<string, unknown>) {
  const videoCode = getTextValue(p.field_codice_video);
  if (!videoCode) return null;

  const posterSrc = getDrupalImageUrl(p.field_immagine);

  return <GenVideo videoCode={videoCode} posterSrc={posterSrc} />;
}

function adaptGenTestoImmagine(p: Record<string, unknown>) {
  const bodyHtml = getProcessedText(p.field_testo);
  const resolvedImage = resolveImage(p.field_immagine);
  if (!bodyHtml || !resolvedImage) return null;

  const imgMeta = (p.field_immagine as Record<string, unknown> | undefined)
    ?.meta as Record<string, unknown> | undefined;
  const imageAlt = (imgMeta?.alt as string) ?? '';
  const titleRaw = getProcessedText(p.field_titolo_formattato);
  const title = titleRaw
    ? titleRaw
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
    : null;
  const layout =
    (getTextValue(p.field_layout_blocco_testo_img) as
      | 'text_dx'
      | 'text_sx'
      | 'text_up') ?? 'text_dx';
  const linkHref =
    getTextValue(p.field_collegamento_esterno) ??
    ((p.field_collegamento_interno as Record<string, unknown> | undefined)
      ?.path as string) ??
    null;
  const linkLabel = getTextValue(p.field_label_collegamento) ?? null;

  return (
    <GenTestoImmagine
      bodyHtml={bodyHtml}
      imageSrc={resolvedImage.url}
      imageWidth={resolvedImage.width}
      imageHeight={resolvedImage.height}
      imageAlt={imageAlt}
      title={title}
      layout={layout}
      linkHref={linkHref}
      linkLabel={linkLabel}
    />
  );
}

function adaptGenGallery(p: Record<string, unknown>) {
  const slideData =
    (p.field_slide as Array<Record<string, unknown>> | undefined) ?? [];
  const slides: GenGallerySlide[] = slideData
    .map((slide) => {
      const resolved = resolveImage(slide.field_immagine);
      if (!resolved) return null;
      const img = slide.field_immagine as Record<string, unknown> | undefined;
      const meta = img?.meta as Record<string, unknown> | undefined;
      const alt = (meta?.alt as string) ?? '';
      const width = resolved.width ?? 1200;
      const height = resolved.height ?? 800;
      // Use alt text as caption when available; skip filename fallback
      // (blocks/{nid} returns images without alt — filename makes ugly captions)
      const caption = alt || null;
      return { src: resolved.url, alt: alt || '', caption, width, height };
    })
    .filter((s) => s !== null) as GenGallerySlide[];

  if (slides.length === 0) return null;

  const titleRaw = getProcessedText(p.field_titolo_formattato);
  const title = titleRaw
    ? titleRaw
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
    : null;

  return <GenGallery slides={slides} title={title} />;
}

function adaptGenTestoImmagineBig(p: Record<string, unknown>) {
  const resolvedImage = resolveImage(p.field_immagine);
  if (!resolvedImage) return null;

  const imgMeta = (p.field_immagine as Record<string, unknown> | undefined)
    ?.meta as Record<string, unknown> | undefined;
  const imageAlt = (imgMeta?.alt as string) ?? '';
  const titleRaw = getProcessedText(p.field_titolo_formattato);
  const title = titleRaw
    ? titleRaw
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
    : null;
  const bodyHtml = getProcessedText(p.field_testo);
  const linkHref =
    getTextValue(p.field_collegamento_esterno) ??
    ((p.field_collegamento_interno as Record<string, unknown> | undefined)
      ?.path as string) ??
    null;
  const linkLabel = getTextValue(p.field_label_collegamento) ?? null;

  return (
    <GenTestoImmagineBig
      imageSrc={resolvedImage.url}
      imageWidth={resolvedImage.width}
      imageHeight={resolvedImage.height}
      imageAlt={imageAlt}
      title={title}
      bodyHtml={bodyHtml}
      linkHref={linkHref}
      linkLabel={linkLabel}
    />
  );
}

function adaptGenTestoImmagineBlog(p: Record<string, unknown>) {
  const bodyHtml = getProcessedText(p.field_testo);
  if (!bodyHtml) return null;

  const titleRaw = getProcessedText(p.field_titolo_formattato);
  const title = titleRaw
    ? titleRaw
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
    : null;
  const resolvedImage = resolveImage(p.field_immagine);
  const imgMeta = (p.field_immagine as Record<string, unknown> | undefined)
    ?.meta as Record<string, unknown> | undefined;
  const imageAlt = (imgMeta?.alt as string) ?? '';

  return (
    <GenTestoImmagineBlog
      bodyHtml={bodyHtml}
      title={title}
      imageSrc={resolvedImage?.url ?? undefined}
      imageWidth={resolvedImage?.width ?? null}
      imageHeight={resolvedImage?.height ?? null}
      imageAlt={imageAlt}
    />
  );
}

function adaptGenGalleryIntro(p: Record<string, unknown>) {
  const title = getTextValue(p.field_titolo_formattato);
  const bodyHtml = getProcessedText(p.field_testo);
  if (!title || !bodyHtml) return null;

  // TODO: overline hardcoded — Drupal field_sopratitolo_approfondiment never populated, needs content entry
  const overline =
    getTextValue(p.field_sopratitolo_approfondiment) ?? 'Lorem ipsum dolor sit';
  const slideData =
    (p.field_slide as Array<Record<string, unknown>> | undefined) ?? [];
  const slides: GenGalleryIntroSlide[] = slideData
    .map((slide) => {
      const resolved = resolveImage(slide.field_immagine);
      if (!resolved) return null;
      const img = slide.field_immagine as Record<string, unknown> | undefined;
      const meta = img?.meta as Record<string, unknown> | undefined;
      const alt = (meta?.alt as string) ?? '';
      const width = resolved.width ?? 1200;
      const height = resolved.height ?? 800;
      return { src: resolved.url, alt, width, height };
    })
    .filter((s) => s !== null) as GenGalleryIntroSlide[];

  if (slides.length === 0) return null;

  return (
    <GenGalleryIntro
      title={title}
      bodyHtml={bodyHtml}
      slides={slides}
      overline={overline}
    />
  );
}

function adaptGenDocumenti(p: Record<string, unknown>) {
  const title = getTextValue(p.field_titolo_formattato) ?? null;
  const docNodes =
    (p.field_documenti as Array<Record<string, unknown>> | undefined) ?? [];

  const documents: GenDocumentiItem[] = docNodes
    .map((doc) => {
      const docTitle = (doc.title as string) ?? '';
      if (!docTitle) return null;
      const imageSrc = getDrupalImageUrl(doc.field_immagine);
      const type = (doc.field_tipologia_documento as string) ?? undefined;
      const href = (doc.field_collegamento_esterno as string) ?? null;
      return { title: docTitle, type, imageSrc, href };
    })
    .filter((d) => d !== null) as GenDocumentiItem[];

  if (documents.length === 0) return null;

  return <GenDocumenti documents={documents} title={title} />;
}

function adaptGenQuote(p: Record<string, unknown>) {
  const text = getProcessedText(p.field_testo);
  if (!text) return null;

  const linkHref =
    getTextValue(p.field_collegamento_esterno) ??
    ((p.field_collegamento_interno as Record<string, unknown> | undefined)
      ?.path as string) ??
    null;
  const linkLabel = getTextValue(p.field_label_collegamento) ?? null;

  return <GenQuote text={text} linkHref={linkHref} linkLabel={linkLabel} />;
}

function drupalRatioToNumber(ratio: string | null | undefined): number {
  const map: Record<string, number> = { '3_2': 3 / 2, '2_3': 2 / 3, '1_1': 1 };
  return map[ratio ?? ''] ?? 1;
}

function adaptGenA(p: Record<string, unknown>) {
  const resolvedImage = resolveImage(p.field_immagine);
  const imageSrc = resolvedImage?.url ?? null;
  const imageAlt =
    ((
      (p.field_immagine as Record<string, unknown> | undefined)?.meta as
        | Record<string, unknown>
        | undefined
    )?.alt as string) ?? '';
  const videoCode = getTextValue(p.field_video) ?? null;
  const ratio = drupalRatioToNumber(getTextValue(p.field_ratio));
  const captionHtml = getProcessedText(p.field_caption);

  const resolvedImageSmall = resolveImage(p.field_immagine_small);
  const imageSmallSrc = resolvedImageSmall?.url ?? null;
  const imageSmallAlt =
    ((
      (p.field_immagine_small as Record<string, unknown> | undefined)?.meta as
        | Record<string, unknown>
        | undefined
    )?.alt as string) ?? '';
  const videoSmallCode = getTextValue(p.field_video_small) ?? null;
  const ratioSmall = drupalRatioToNumber(getTextValue(p.field_ratio_small));
  const captionSmallHtml = getProcessedText(p.field_caption_small);

  const layout =
    (getTextValue(p.field_layout_blocco_a) as 'img_big_sx' | 'img_big_dx') ??
    'img_big_sx';

  if (!imageSrc && !videoCode && !imageSmallSrc && !videoSmallCode) return null;

  return (
    <GenA
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      videoCode={videoCode}
      ratio={ratio}
      captionHtml={captionHtml}
      imageSmallSrc={imageSmallSrc}
      imageSmallAlt={imageSmallAlt}
      videoSmallCode={videoSmallCode}
      ratioSmall={ratioSmall}
      captionSmallHtml={captionSmallHtml}
      layout={layout}
    />
  );
}

function adaptGenB(p: Record<string, unknown>) {
  const images =
    (p.field_3_immagini as Array<Record<string, unknown>> | undefined) ?? [];
  const videos = (p.field_3_video as Array<string> | undefined) ?? [];

  const items: GenBItem[] = images.map((img, i) => ({
    imageSrc: resolveImage(img)?.url ?? null,
    imageAlt:
      ((
        (img as Record<string, unknown>)?.meta as
          | Record<string, unknown>
          | undefined
      )?.alt as string) ?? '',
    videoCode: videos[i] ?? null,
  }));

  if (items.length === 0) return null;

  return <GenB items={items} />;
}

function adaptGenC(p: Record<string, unknown>) {
  const titleRaw = getProcessedText(p.field_titolo_formattato);
  const title = titleRaw
    ? titleRaw
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
    : null;
  const bodyHtml = getProcessedText(p.field_testo);
  const resolvedImage = resolveImage(p.field_immagine);
  const imageSrc = resolvedImage?.url ?? null;
  const imageAlt =
    ((
      (p.field_immagine as Record<string, unknown> | undefined)?.meta as
        | Record<string, unknown>
        | undefined
    )?.alt as string) ?? '';
  const videoCode = getTextValue(p.field_video) ?? null;
  const captionHtml = getProcessedText(p.field_caption);
  const linkHref =
    getTextValue(p.field_collegamento_esterno) ??
    ((p.field_collegamento_interno as Record<string, unknown> | undefined)
      ?.path as string) ??
    null;
  const linkLabel = getTextValue(p.field_label_collegamento) ?? null;
  const layout =
    (getTextValue(p.field_layout_blocco_c) as 'text_sx' | 'text_dx') ??
    'text_sx';

  if (!imageSrc && !videoCode && !bodyHtml) return null;

  return (
    <GenC
      title={title}
      bodyHtml={bodyHtml}
      linkHref={linkHref}
      linkLabel={linkLabel}
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      videoCode={videoCode}
      captionHtml={captionHtml}
      layout={layout}
    />
  );
}

// ── Resolver ────────────────────────────────────────────────────────────────

interface ParagraphResolverProps {
  paragraph: Record<string, unknown>;
  pageTitle?: string;
}

export default function ParagraphResolver({
  paragraph,
  pageTitle,
}: ParagraphResolverProps) {
  const type = paragraph.type as string;

  // ── Gen → block name mapping for debug overlay ──
  const GEN_MAP: Record<
    string,
    { name: string; render: () => React.ReactNode }
  > = {
    'paragraph--blocco_intro': {
      name: 'GenIntro',
      render: () => adaptGenIntro(paragraph, pageTitle),
    },
    'paragraph--blocco_quote': {
      name: 'GenQuote',
      render: () => adaptGenQuote(paragraph),
    },
    'paragraph--blocco_video': {
      name: 'GenVideo',
      render: () => adaptGenVideo(paragraph),
    },
    'paragraph--blocco_testo_immagine': {
      name: 'GenTestoImmagine',
      render: () => adaptGenTestoImmagine(paragraph),
    },
    'paragraph--blocco_gallery': {
      name: 'GenGallery',
      render: () => adaptGenGallery(paragraph),
    },
    'paragraph--blocco_testo_immagine_big': {
      name: 'GenTestoImmagineBig',
      render: () => adaptGenTestoImmagineBig(paragraph),
    },
    'paragraph--blocco_testo_immagine_blog': {
      name: 'GenTestoImmagineBlog',
      render: () => adaptGenTestoImmagineBlog(paragraph),
    },
    'paragraph--blocco_gallery_intro': {
      name: 'GenGalleryIntro',
      render: () => adaptGenGalleryIntro(paragraph),
    },
    'paragraph--blocco_documenti': {
      name: 'GenDocumenti',
      render: () => adaptGenDocumenti(paragraph),
    },
    'paragraph--blocco_a': { name: 'GenA', render: () => adaptGenA(paragraph) },
    'paragraph--blocco_b': { name: 'GenB', render: () => adaptGenB(paragraph) },
    'paragraph--blocco_c': { name: 'GenC', render: () => adaptGenC(paragraph) },
    'paragraph--blocco_e': {
      name: 'GenE',
      render: () => <GenE paragraph={paragraph} />,
    },
  };

  // Gen blocks (DS)
  const gen = GEN_MAP[type];
  if (gen) {
    const content = gen.render();
    if (!content) return null;
    return (
      <DevBlockOverlay name={gen.name} status="ds">
        {content}
      </DevBlockOverlay>
    );
  }

  // Legacy blocks
  const Component = LEGACY_MAP[type];
  if (!Component) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <DevBlockOverlay name={`Unknown: ${type}`} status="legacy">
          <div style={{ padding: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e' }}>
              Unknown paragraph: <code>{type}</code>
            </p>
          </div>
        </DevBlockOverlay>
      );
    }
    return null;
  }

  const legacyName = type
    .replace('paragraph--', '')
    .replace(/^blocco_/, 'Blocco');
  const legacyDisplayName =
    legacyName.charAt(0).toUpperCase() + legacyName.slice(1);
  return (
    <DevBlockOverlay name={legacyDisplayName} status="legacy">
      <Component paragraph={paragraph} />
    </DevBlockOverlay>
  );
}
