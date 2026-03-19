import { drupalFetch } from '@/api/client';
import { deserialize } from '@/api/jsonapi/deserializer';
import { buildQuery } from '@/api/jsonapi/query-builder';
import { ProdottoMosaicoSchema } from '@/types/drupal/products/mosaico';
import { ProdottoTessutoSchema } from '@/types/drupal/products/tessuto';
import { ProdottoArredoSchema } from '@/types/drupal/products/arredo';
import { ProdottoVetriteSchema } from '@/types/drupal/products/vetrite';
import { ProdottoPixallSchema } from '@/types/drupal/products/pixall';
import type { ApiResult } from '@/api/client';
import { ISR } from '@/config/isr';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import { z } from 'zod';

const SCHEMA_MAP = {
  prodotto_mosaico: ProdottoMosaicoSchema,
  prodotto_tessuto: ProdottoTessutoSchema,
  prodotto_arredo: ProdottoArredoSchema,
  prodotto_vetrite: ProdottoVetriteSchema,
  prodotto_pixall: ProdottoPixallSchema,
} as const;

type ProductType = keyof typeof SCHEMA_MAP;
type ProductOf<T extends ProductType> = z.infer<(typeof SCHEMA_MAP)[T]>;

type JsonApiSingleRaw = {
  data: {
    id: string;
    type: string;
    attributes?: Record<string, unknown>;
    relationships?: Record<string, unknown>;
  };
  included?: unknown[];
};

export async function fetchProduct<T extends ProductType>(
  productType: T,
  id: string,
  locale: string,
): Promise<ApiResult<ProductOf<T>>> {
  const config = FILTER_REGISTRY[productType];
  const includes = config?.includes ?? [];
  const qs = buildQuery({ include: includes });
  const path = `/${locale}/jsonapi/node/${productType}/${id}?${qs}`;

  const result = await drupalFetch<JsonApiSingleRaw>(path, {
    next: { revalidate: ISR.PRODUCTS },
  });

  if (!result.ok) return result;

  // deserialize expects JsonApiSingleResponse shape
  const raw = deserialize(result.data as Parameters<typeof deserialize>[0]);
  const schema = SCHEMA_MAP[productType] as unknown as z.ZodType<ProductOf<T>>;
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION', message: parsed.error.message },
    };
  }
  return { ok: true, data: parsed.data };
}
