import { getProcessedText } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';

export default function BloccoFormBlog({ paragraph }: { paragraph: Record<string, unknown> }) {
  const title = getProcessedText(paragraph.field_titolo_formattato);
  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-xl mx-auto px-8">
        {title && (
          <h2
            className="text-2xl font-bold mb-6 leading-tight [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }}
          />
        )}
        <div className="border-2 border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">Form placeholder</div>
      </div>
    </section>
  );
}
