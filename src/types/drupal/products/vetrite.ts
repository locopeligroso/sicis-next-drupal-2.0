import { z } from 'zod';
import {
  BaseNodeSchema,
  TaxonomyRefSchema,
  ImageFieldSchema,
} from '../base';

export const ProdottoVetriteSchema = BaseNodeSchema.extend({
  type: z.literal('node--prodotto_vetrite'),
  field_immagine_anteprima: ImageFieldSchema,
  field_gallery: z.array(ImageFieldSchema).optional(),
  field_collezione: TaxonomyRefSchema.nullable().optional(),
  field_colori: z.array(TaxonomyRefSchema).optional(),
  field_finiture: z.array(TaxonomyRefSchema).optional(),
  field_texture: z.array(TaxonomyRefSchema).optional(),
  field_dimensioni_cm: z.string().nullable().optional(),
  field_dimensioni_inch: z.string().nullable().optional(),
  field_dimensione_pattern_cm: z.string().nullable().optional(),
  field_dimensione_pattern_inch: z.string().nullable().optional(),
  field_formato_campione: z.string().nullable().optional(),
  field_prezzo_eu: z
    .object({ value: z.string() })
    .nullable()
    .optional(),
  field_prezzo_usa: z
    .object({ value: z.string() })
    .nullable()
    .optional(),
  field_prezzo_on_demand: z.boolean().optional(),
  field_no_usa_stock: z.boolean().optional(),
});

export type ProdottoVetrite = z.infer<typeof ProdottoVetriteSchema>;
