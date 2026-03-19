import { getProcessedText } from '@/lib/field-helpers';
import { getDrupalImageUrl } from '@/lib/image-helpers';

export default function BloccoVideo({ paragraph }: { paragraph: Record<string, unknown> }) {
  const title = getProcessedText(paragraph.field_titolo_formattato);
  const vimeoId = paragraph.field_codice_video as string | undefined;
  const thumbnailUrl = getDrupalImageUrl(paragraph.field_immagine);

  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-8">
        {title && (
          <h2
            className="text-2xl font-bold mb-6 leading-tight [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        )}
        <div className="aspect-video bg-gray-900 overflow-hidden">
          {vimeoId ? (
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?dnt=1`}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={title ? title.replace(/<[^>]*>/g, '') : 'Video'}
              loading="lazy"
            />
          ) : thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              ▶ Video
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
