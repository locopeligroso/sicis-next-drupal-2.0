import { z } from 'zod';
import {
  BaseNodeSchema,
  TaxonomyRefSchema,
  ImageFieldSchema,
  DocumentSchema,
} from '../base';

export const ProdottoMosaicoSchema = BaseNodeSchema.extend({
  type: z.literal('node--prodotto_mosaico'),
  field_collezione: TaxonomyRefSchema.nullable().optional(),
  field_colori: z.array(TaxonomyRefSchema).optional(),
  field_forma: z.array(TaxonomyRefSchema).optional(),
  field_finitura: z.array(TaxonomyRefSchema).optional(),
  field_stucco: z.array(TaxonomyRefSchema).optional(),
  field_gallery: z.array(ImageFieldSchema).optional(),
  field_prezzo_eu: z.string().nullable().optional(),
  field_prezzo_usa: z.string().nullable().optional(),
  field_prezzo_on_demand: z.boolean().optional(),
  field_no_usa_stock: z.boolean().optional(),
  field_retinatura: z.string().nullable().optional(),
  field_dimensione_tessera_mm: z.string().nullable().optional(),
  field_dimensione_foglio_mm: z.string().nullable().optional(),
  field_spessore_mm: z.string().nullable().optional(),
  field_consumo_stucco_m2: z.string().nullable().optional(),
  field_resistenza_gelo: z.boolean().optional(),
  field_resistenza_acido: z.boolean().optional(),
  field_resistenza_abrasione: z.boolean().optional(),
  field_resistenza_scivolamento: z.boolean().optional(),
  field_resistenza_piscina: z.boolean().optional(),
  field_resistenza_esterno: z.boolean().optional(),
  field_documenti: z.array(DocumentSchema).optional(),
});

export type ProdottoMosaico = z.infer<typeof ProdottoMosaicoSchema>;
