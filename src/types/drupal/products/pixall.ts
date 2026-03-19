import { z } from 'zod';
import {
  BaseNodeSchema,
  TaxonomyRefSchema,
  ImageFieldSchema,
  DocumentSchema,
} from '../base';

export const ProdottoPixallSchema = BaseNodeSchema.extend({
  type: z.literal('node--prodotto_pixall'),
  field_immagine_anteprima: ImageFieldSchema,
  field_immagine_moduli: ImageFieldSchema,
  field_gallery: z.array(ImageFieldSchema).optional(),
  field_colori: z.array(TaxonomyRefSchema).optional(),
  field_forma: z.array(TaxonomyRefSchema).optional(),
  field_stucco: z.array(TaxonomyRefSchema).optional(),
  field_composizione: z
    .object({ value: z.string(), processed: z.string().optional() })
    .nullable()
    .optional(),
  field_manutenzione: z
    .object({ value: z.string(), processed: z.string().optional() })
    .nullable()
    .optional(),
  field_utilizzi: z
    .object({ value: z.string(), processed: z.string().optional() })
    .nullable()
    .optional(),
  field_dimensione_tessera_mm: z.string().nullable().optional(),
  field_dimensione_tessera_inch: z.string().nullable().optional(),
  field_dimensione_foglio_mm: z.string().nullable().optional(),
  field_dimensione_foglio_inch: z.string().nullable().optional(),
  field_dimensione_moduli: z.string().nullable().optional(),
  field_numero_moduli: z.string().nullable().optional(),
  field_consumo_stucco_m2: z.number().nullable().optional(),
  field_consumo_stucco_sqft: z.number().nullable().optional(),
  field_retinatura: z.string().nullable().optional(),
  field_documenti: z.array(DocumentSchema).optional(),
});

export type ProdottoPixall = z.infer<typeof ProdottoPixallSchema>;
