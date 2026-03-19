import BloccoSliderHome from './BloccoSliderHome';
import BloccoIntro from './BloccoIntro';
import BloccoTestoImmagine from './BloccoTestoImmagine';
import BloccoTestoImmagineBig from './BloccoTestoImmagineBig';
import BloccoTestoImmagineBlog from './BloccoTestoImmagineBlog';
import BloccoGallery from './BloccoGallery';
import BloccoGalleryIntro from './BloccoGalleryIntro';
import BloccoVideo from './BloccoVideo';
import BloccoQuote from './BloccoQuote';
import BloccoCorrelati from './BloccoCorrelati';
import BloccoDocumenti from './BloccoDocumenti';
import BloccoNewsletter from './BloccoNewsletter';
import BloccoFormBlog from './BloccoFormBlog';
import BloccoAnni from './BloccoAnni';
import BloccoTutorial from './BloccoTutorial';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParagraphComponent = (props: { paragraph: Record<string, unknown> }) => any;

const PARAGRAPH_MAP: Record<string, ParagraphComponent> = {
  'paragraph--blocco_slider_home': BloccoSliderHome,
  'paragraph--blocco_intro': BloccoIntro,
  'paragraph--blocco_testo_immagine': BloccoTestoImmagine,
  'paragraph--blocco_testo_immagine_big': BloccoTestoImmagineBig,
  'paragraph--blocco_testo_immagine_blog': BloccoTestoImmagineBlog,
  'paragraph--blocco_gallery': BloccoGallery,
  'paragraph--blocco_gallery_intro': BloccoGalleryIntro,
  'paragraph--blocco_video': BloccoVideo,
  'paragraph--blocco_quote': BloccoQuote,
  'paragraph--blocco_correlati': BloccoCorrelati,
  'paragraph--blocco_documenti': BloccoDocumenti,
  'paragraph--blocco_newsletter': BloccoNewsletter,
  'paragraph--blocco_form_blog': BloccoFormBlog,
  'paragraph--blocco_anni': BloccoAnni,
  'paragraph--blocco_tutorial': BloccoTutorial,
};

interface ParagraphResolverProps {
  paragraph: Record<string, unknown>;
}

export default function ParagraphResolver({ paragraph }: ParagraphResolverProps) {
  const type = paragraph.type as string;
  const Component = PARAGRAPH_MAP[type];

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
