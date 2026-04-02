'use client';

import { AddToSampleCartButton } from './AddToSampleCartButton';
import type { SampleCartItem } from '@/domain/sample-cart/types';

interface VetriteSampleSectionProps {
  nid: number;
  title: string;
  imageUrl: string | null;
  collection: string | null;
  sampleFormat: string | null;
  finitureUsa: string[]; // available finish variants for US
  hasSample: boolean;
}

export function VetriteSampleSection({
  nid,
  title,
  imageUrl,
  collection,
  sampleFormat,
  finitureUsa,
  hasSample,
}: VetriteSampleSectionProps) {
  if (!hasSample) return null;

  const item: Omit<SampleCartItem, 'variant'> = {
    nid,
    type: 'vetrite',
    title,
    imageUrl,
    collection,
    sampleFormat,
  };

  return (
    <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
      <AddToSampleCartButton
        item={item}
        variantOptions={finitureUsa.length > 0 ? finitureUsa : undefined}
      />
    </div>
  );
}
