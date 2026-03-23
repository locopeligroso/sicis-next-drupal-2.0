import { getDrupalImageUrl } from '@/lib/drupal/image';
import { getProcessedText } from '@/lib/field-helpers';
import SliderClient, { type SlideData } from './SliderClient';

export default async function BloccoSliderHome({ paragraph }: { paragraph: Record<string, unknown> }) {
  const data = paragraph;

  const items = (data.field_elementi as Record<string, unknown>[] | undefined) ?? [];

  // Build serializable slide data for the Client Component
  const slides: SlideData[] = items.map((item, i) => {
    const el = item as Record<string, unknown>;
    return {
      id: (el.id as string) ?? String(i),
      imageUrl: getDrupalImageUrl(el.field_immagine),
      text: getProcessedText(el.field_testo),
      label: el.field_label_collegamento as string | undefined,
      link: el.field_collegamento_esterno as string | undefined,
    };
  });

  return <SliderClient slides={slides} autoplayMs={5000} />;
}
