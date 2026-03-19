import { z } from 'zod';
import {
  BaseNodeSchema,
  TaxonomyRefSchema,
  ImageFieldSchema,
  DocumentSchema,
} from '../base';

const CategoriaRefSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    title: z.string().optional(),
    field_immagine: ImageFieldSchema,
  })
  .passthrough()
  .nullable()
  .optional();

export const ProdottoArredoSchema = BaseNodeSchema.extend({
  type: z.literal('node--prodotto_arredo'),
  field_immagine_anteprima: ImageFieldSchema,
  field_gallery: z.array(ImageFieldSchema).optional(),
  field_gallery_intro: z.array(ImageFieldSchema).optional(),
  field_categoria: CategoriaRefSchema,
  field_finiture: z.array(TaxonomyRefSchema).optional(),
  field_materiali: z
    .object({ value: z.string(), processed: z.string().optional() })
    .nullable()
    .optional(),
  field_specifiche_tecniche: z
    .object({ value: z.string(), processed: z.string().optional() })
    .nullable()
    .optional(),
  field_prezzo_eu: z
    .object({ value: z.string() })
    .nullable()
    .optional(),
  field_prezzo_usa: z
    .object({ value: z.string() })
    .nullable()
    .optional(),
  field_collegamento_esterno: z
    .union([
      z.object({ uri: z.string(), title: z.string().optional() }),
      z.string(),
    ])
    .nullable()
    .optional(),
  field_documenti: z.array(DocumentSchema).optional(),
  field_scheda_tecnica: z
    .array(z.object({ entity: z.object({ uri: z.object({ value: z.string() }) }) }))
    .optional(),
});

export type ProdottoArredo = z.infer<typeof ProdottoArredoSchema>;
