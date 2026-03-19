import { z } from 'zod';
import {
  BaseNodeSchema,
  TaxonomyRefSchema,
  ImageFieldSchema,
  DocumentSchema,
} from '../base';

export const ProdottoTessutoSchema = BaseNodeSchema.extend({
  type: z.literal('node--prodotto_tessuto'),
  field_immagine_anteprima: ImageFieldSchema,
  field_categoria: z
    .object({
      id: z.string(),
      type: z.string(),
      title: z.string().optional(),
    })
    .passthrough()
    .nullable()
    .optional(),
  field_colori: z.array(TaxonomyRefSchema).optional(),
  field_finiture_tessuto: z.union([TaxonomyRefSchema, z.array(TaxonomyRefSchema)]).optional(),
  field_tipologia_tessuto: z.union([TaxonomyRefSchema, z.array(TaxonomyRefSchema)]).optional(),
  field_indicazioni_manutenzione: z.array(TaxonomyRefSchema).optional(),
  field_gallery: z.array(ImageFieldSchema).optional(),
  field_gallery_intro: z.array(ImageFieldSchema).optional(),
  field_documenti: z.array(DocumentSchema).optional(),
  field_altezza_cm: z.string().nullable().optional(),
  field_altezza_inch: z.string().nullable().optional(),
  field_peso: z.string().nullable().optional(),
  field_utilizzo: z.string().nullable().optional(),
});

export type ProdottoTessuto = z.infer<typeof ProdottoTessutoSchema>;
