// ── Gen blocks (DS) ─────────────────────────────────────────────────────────
import { GenIntro } from '@/components/blocks/GenIntro';
import { GenQuote } from '@/components/blocks/GenQuote';
import { GenVideo } from '@/components/blocks/GenVideo';
import { GenTestoImmagine } from '@/components/blocks/GenTestoImmagine';
import { getTextValue, getProcessedText } from '@/lib/field-helpers';
import { getDrupalImageUrl } from '@/lib/drupal/image';

// ── Legacy blocks ───────────────────────────────────────────────────────────
import BloccoSliderHome from './BloccoSliderHome';
import BloccoTestoImmagineBig from './BloccoTestoImmagineBig';
import BloccoTestoImmagineBlog from './BloccoTestoImmagineBlog';
import BloccoGallery from './BloccoGallery';
import BloccoGalleryIntro from './BloccoGalleryIntro';
import BloccoVideo from './BloccoVideo';
import BloccoCorrelati from './BloccoCorrelati';
import BloccoDocumenti from './BloccoDocumenti';
import BloccoNewsletter from './BloccoNewsletter';
import BloccoFormBlog from './BloccoFormBlog';
import BloccoAnni from './BloccoAnni';
import BloccoTutorial from './BloccoTutorial';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParagraphComponent = (props: { paragraph: Record<string, unknown> }) => any;

const LEGACY_MAP: Record<string, ParagraphComponent> = {
  'paragraph--blocco_slider_home': BloccoSliderHome,
  'paragraph--blocco_testo_immagine_big': BloccoTestoImmagineBig,
  'paragraph--blocco_testo_immagine_blog': BloccoTestoImmagineBlog,
  'paragraph--blocco_gallery': BloccoGallery,
  'paragraph--blocco_gallery_intro': BloccoGalleryIntro,
  'paragraph--blocco_video': BloccoVideo,
  'paragraph--blocco_correlati': BloccoCorrelati,
  'paragraph--blocco_documenti': BloccoDocumenti,
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
