import { z } from 'zod';

export const TextFieldSchema = z.object({
  value: z.string(),
  processed: z.string().optional(),
});

export const ImageUriSchema = z.object({
  url: z.string(),
  value: z.string().optional(),
});

export const ImageEntitySchema = z.object({
  uri: ImageUriSchema,
  filename: z.string().optional(),
});

export const ImageFieldSchema = z
  .object({ entity: ImageEntitySchema })
  .nullable()
  .optional();

export const FileEntitySchema = z.object({
  uri: z.object({ value: z.string() }),
  filename: z.string().optional(),
});

export const FileFieldSchema = z
  .object({ entity: FileEntitySchema })
  .nullable()
  .optional();

export const TaxonomyRefSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    name: z.string().optional(),
    field_immagine: ImageFieldSchema,
  })
  .passthrough();

/** Single source of truth for DocItem — replaces 5 identical inline definitions */
export const DocumentSchema = z.object({
  id: z.string().optional(),
  field_titolo_main: z.unknown().optional(),
  title: z.unknown().optional(),
  field_tipologia_documento: z.unknown().optional(),
  field_collegamento_esterno: z.unknown().optional(),
  field_immagine: ImageFieldSchema,
  field_allegato: z
    .object({
      entity: z.object({ uri: z.object({ value: z.string() }) }).optional(),
    })
    .nullable()
    .optional(),
});

export type DocumentItem = z.infer<typeof DocumentSchema>;

export const PathAliasSchema = z.object({
  alias: z.string().optional(),
  pid: z.number().optional(),
  langcode: z.string().optional(),
});

export const BaseNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  langcode: z.string().optional(),
  status: z.boolean().optional(),
  title: z.string().optional(),
  path: PathAliasSchema.optional(),
  field_titolo_main: z.unknown().optional(),
  field_testo_main: z.unknown().optional(),
  field_immagine: ImageFieldSchema,
});
