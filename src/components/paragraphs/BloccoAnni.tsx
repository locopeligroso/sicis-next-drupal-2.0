import { getProcessedText } from '@/lib/field-helpers';

export default function BloccoAnni({ paragraph }: { paragraph: Record<string, unknown> }) {
  const title = getProcessedText(paragraph.field_titolo_formattato);
  const items = (paragraph.field_elementi as Record<string, unknown>[] | undefined) ?? [];
  const count = items.length || 4;
  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-8">
        {title && (
          <h2
            className="text-2xl font-bold mb-8 leading-tight [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        )}
        <div className="flex gap-8 overflow-x-auto pb-4">
          {Array.from({ length: count }).map((_, i) => {
            const item = items[i] as Record<string, unknown> | undefined;
            const year = item ? ((item.field_anno as string) || String(1970 + i * 5)) : String(1970 + i * 5);
            const text = item ? ((item.field_testo as { processed?: string })?.processed || '') : '';
            return (
              <div key={i} className="min-w-[10rem] border-l-4 border-gray-200 pl-4 flex-shrink-0">
                <p className="text-2xl font-bold text-gray-300 mb-1">{year}</p>
                {text ? (
                  <div className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: text }} />
                ) : (
                  <p className="text-sm text-gray-400">Evento {i + 1}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
