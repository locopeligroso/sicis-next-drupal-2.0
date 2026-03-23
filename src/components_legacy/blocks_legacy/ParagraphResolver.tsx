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
import { getTextValue, getProcessedText } from '@/lib/field-helpers';
import { getDrupalImageUrl } from '@/lib/drupal/image';

// ── Legacy blocks ───────────────────────────────────────────────────────────
import BloccoSliderHome from './BloccoSliderHome';
// BloccoGallery removed — replaced by GenGallery
// BloccoTestoImmagineBig removed — replaced by GenTestoImmagineBig
// BloccoTestoImmagineBlog removed — replaced by GenTestoImmagineBlog
// BloccoGalleryIntro removed — replaced by GenGalleryIntro
import BloccoVideo from './BloccoVideo';
import BloccoCorrelati from './BloccoCorrelati';
// BloccoDocumenti removed — replaced by GenDocumenti
import BloccoNewsletter from './BloccoNewsletter';
import BloccoFormBlog from './BloccoFormBlog';
import BloccoAnni from './BloccoAnni';
import BloccoTutorial from './BloccoTutorial';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParagraphComponent = (props: { paragraph: Record<string, unknown> }) => any;

const LEGACY_MAP: Record<string, ParagraphComponent> = {
  'paragraph--blocco_slider_home': BloccoSliderHome,
  // blocco_testo_immagine_blog removed — replaced by GenTestoImmagineBlog
  // blocco_gallery_intro removed — replaced by GenGalleryIntro
  'paragraph--blocco_video': BloccoVideo,
  'paragraph--blocco_correlati': BloccoCorrelati,
  // blocco_documenti removed — replaced by GenDocumenti
  'paragraph--blocco_newsletter': BloccoNewsletter,
  'paragraph--blocco_form_blog': BloccoFormBlog,
  'paragraph--blocco_anni': BloccoAnni,
  'paragraph--blocco_tutorial': BloccoTutorial,
};

// ── Gen adapters ────────────────────────────────────────────────────────────

function adaptGenIntro(p: Record<string, unknown>) {
  const title = getTextValue(p.field_titolo_formattato);
  const subtitle = getTextValue(p.field_sopratitolo_approfondiment) ?? '';
  const bodyHtml = getProcessedText(p.field_testo);
  const imageSrc = getDrupalImageUrl(p.field_immagine);
  const imageAlt = (p.field_immagine as Record<string, unknown> | undefined)?.meta
    ? ((p.field_immagine as Record<string, unknown>).meta as Record<string, unknown>)?.alt as string ?? ''
    : '';
  const linkHref = getTextValue(p.field_collegamento_esterno)
    ?? (p.field_collegamento_interno as Record<string, unknown> | undefined)?.path as string
    ?? null;
  const linkLabel = getTextValue(p.field_label_collegamento) ?? null;

  if (!title || !bodyHtml || !imageSrc) return null;

  return (
    <GenIntro
      title={title}
      subtitle={subtitle}
      bodyHtml={bodyHtml}
      imageSrc={imageSrc}
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
  const imageSrc = getDrupalImageUrl(p.field_immagine);
  if (!bodyHtml || !imageSrc) return null;

  const imgMeta = (p.field_immagine as Record<string, unknown> | undefined)?.meta as Record<string, unknown> | undefined;
  const imageAlt = (imgMeta?.alt as string) ?? '';
  const titleRaw = getProcessedText(p.field_titolo_formattato);
  const title = titleRaw ? titleRaw.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() : null;
  const layout = (getTextValue(p.field_layout_blocco_testo_img) as 'text_dx' | 'text_sx' | 'text_up') ?? 'text_dx';
  const linkHref = getTextValue(p.field_collegamento_esterno)
    ?? (p.field_collegamento_interno as Record<string, unknown> | undefined)?.path as string
    ?? null;
  const linkLabel = getTextValue(p.field_label_collegamento) ?? null;

  return (
    <GenTestoImmagine
      bodyHtml={bodyHtml}
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      title={title}
      layout={layout}
      linkHref={linkHref}
      linkLabel={linkLabel}
    />
  );
}

function adaptGenGallery(p: Record<string, unknown>) {
  const slideData = (p.field_slide as Array<Record<string, unknown>> | undefined) ?? [];
  const slides: GenGallerySlide[] = slideData
    .map((slide) => {
      const src = getDrupalImageUrl(slide.field_immagine);
      if (!src) return null;
      const img = slide.field_immagine as Record<string, unknown> | undefined;
      const meta = img?.meta as Record<string, unknown> | undefined;
      const alt = (meta?.alt as string) ?? '';
      const width = meta?.width as number | undefined;
      const height = meta?.height as number | undefined;
      // Use alt text as caption, fallback to filename from URL
      const filename = src.split('/').pop()?.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') ?? '';
      const caption = alt || filename || null;
      return { src, alt: alt || filename, caption, width, height };
    })
    .filter((s) => s !== null) as GenGallerySlide[];

  if (slides.length === 0) return null;

  const titleRaw = getProcessedText(p.field_titolo_formattato);
  const title = titleRaw ? titleRaw.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() : null;

  return <GenGallery slides={slides} title={title} />;
}

function adaptGenTestoImmagineBig(p: Record<string, unknown>) {
  const imageSrc = getDrupalImageUrl(p.field_immagine);
  if (!imageSrc) return null;

  const imgMeta = (p.field_immagine as Record<string, unknown> | undefined)?.meta as Record<string, unknown> | undefined;
  const imageAlt = (imgMeta?.alt as string) ?? '';
  const titleRaw = getProcessedText(p.field_titolo_formattato);
  const title = titleRaw ? titleRaw.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() : null;
  const bodyHtml = getProcessedText(p.field_testo);
  const linkHref = getTextValue(p.field_collegamento_esterno)
    ?? (p.field_collegamento_interno as Record<string, unknown> | undefined)?.path as string
    ?? null;
  const linkLabel = getTextValue(p.field_label_collegamento) ?? null;

  return (
    <GenTestoImmagineBig
      imageSrc={imageSrc}
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
  const title = titleRaw ? titleRaw.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() : null;
  const imageSrc = getDrupalImageUrl(p.field_immagine);
  const imgMeta = (p.field_immagine as Record<string, unknown> | undefined)?.meta as Record<string, unknown> | undefined;
  const imageAlt = (imgMeta?.alt as string) ?? '';

  return (
    <GenTestoImmagineBlog
      bodyHtml={bodyHtml}
      title={title}
      imageSrc={imageSrc}
      imageAlt={imageAlt}
    />
  );
}

function adaptGenGalleryIntro(p: Record<string, unknown>) {
  const title = getTextValue(p.field_titolo_formattato);
  const bodyHtml = getProcessedText(p.field_testo);
  if (!title || !bodyHtml) return null;

  // TODO: overline hardcoded — Drupal field_sopratitolo_approfondiment never populated, needs content entry
  const overline = getTextValue(p.field_sopratitolo_approfondiment) ?? 'Lorem ipsum dolor sit';
  const slideData = (p.field_slide as Array<Record<string, unknown>> | undefined) ?? [];
  const slides: GenGalleryIntroSlide[] = slideData
    .map((slide) => {
      const src = getDrupalImageUrl(slide.field_immagine);
      if (!src) return null;
      const img = slide.field_immagine as Record<string, unknown> | undefined;
      const meta = img?.meta as Record<string, unknown> | undefined;
      const alt = (meta?.alt as string) ?? '';
      const width = meta?.width as number | undefined;
      const height = meta?.height as number | undefined;
      return { src, alt, width, height };
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
  const docNodes = (p.field_documenti as Array<Record<string, unknown>> | undefined) ?? [];

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

  const linkHref = getTextValue(p.field_collegamento_esterno)
    ?? (p.field_collegamento_interno as Record<string, unknown> | undefined)?.path as string
    ?? null;
  const linkLabel = getTextValue(p.field_label_collegamento) ?? null;

  return <GenQuote text={text} linkHref={linkHref} linkLabel={linkLabel} />;
}

// ── Resolver ────────────────────────────────────────────────────────────────

interface ParagraphResolverProps {
  paragraph: Record<string, unknown>;
}

export default function ParagraphResolver({ paragraph }: ParagraphResolverProps) {
  const type = paragraph.type as string;

  // Gen blocks (DS)
  if (type === 'paragraph--blocco_intro') return adaptGenIntro(paragraph);
  if (type === 'paragraph--blocco_quote') return adaptGenQuote(paragraph);
  if (type === 'paragraph--blocco_video') return adaptGenVideo(paragraph);
  if (type === 'paragraph--blocco_testo_immagine') return adaptGenTestoImmagine(paragraph);
  if (type === 'paragraph--blocco_gallery') return adaptGenGallery(paragraph);
  if (type === 'paragraph--blocco_testo_immagine_big') return adaptGenTestoImmagineBig(paragraph);
  if (type === 'paragraph--blocco_testo_immagine_blog') return adaptGenTestoImmagineBlog(paragraph);
  if (type === 'paragraph--blocco_gallery_intro') return adaptGenGalleryIntro(paragraph);
  if (type === 'paragraph--blocco_documenti') return adaptGenDocumenti(paragraph);

  // Legacy blocks
  const Component = LEGACY_MAP[type];
  if (!Component) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div style={{ padding: '1rem', border: '0.0625rem dashed #f59e0b', background: '#fffbeb', marginBottom: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e' }}>
            Unknown paragraph: <code>{type}</code>
          </p>
        </div>
      );
    }
    return null;
  }

  return <Component paragraph={paragraph} />;
}
