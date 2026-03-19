import { DrupalJsonApiParams } from 'drupal-jsonapi-params';

export type FilterOperator =
  | '='
  | '<>'
  | '>'
  | '>='
  | '<'
  | '<='
  | 'IN'
  | 'NOT IN'
  | 'CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'BETWEEN'
  | 'IS NULL'
  | 'IS NOT NULL';

export type FilterDef = {
  field: string;
  value?: string | string[];
  operator?: FilterOperator;
};

export type QueryOptions = {
  filters?: FilterDef[];
  include?: string[];
  fields?: Record<string, string[]>;
  sort?: string;
  limit?: number;
  offset?: number;
};

/**
 * Builds a JSON:API query string using drupal-jsonapi-params.
 * Single source of truth for all Drupal API query construction —
 * replaces ad-hoc URLSearchParams usage scattered across fetch-*.ts files.
 */
export function buildQuery(opts: QueryOptions): string {
  const p = new DrupalJsonApiParams();

  if (opts.limit !== undefined) p.addPageLimit(opts.limit);
  if (opts.offset !== undefined) p.addPageOffset(opts.offset);
  if (opts.sort) p.addSort(opts.sort);
  if (opts.include?.length) p.addInclude(opts.include);

  for (const [type, fieldList] of Object.entries(opts.fields ?? {})) {
    p.addFields(type, fieldList);
  }

  for (const f of opts.filters ?? []) {
    if (Array.isArray(f.value)) {
      // Multi-value → IN operator (workaround for broken OR groups in Drupal)
      p.addFilter(f.field, f.value, 'IN');
    } else if (f.value !== undefined) {
      p.addFilter(f.field, f.value, (f.operator ?? '=') as string);
    }
  }

  return p.getQueryString();
}
