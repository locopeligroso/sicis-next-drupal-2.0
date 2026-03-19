// ════════════════════════════════════════════════════════════════════════════
// §2  Types
// ════════════════════════════════════════════════════════════════════════════

export interface JsonApiResource {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, JsonApiRelationship>;
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface JsonApiRelationship {
  data: JsonApiResourceIdentifier | JsonApiResourceIdentifier[] | null;
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface JsonApiResourceIdentifier {
  type: string;
  id: string;
  meta?: Record<string, unknown>;
}

export interface TranslatePathResponse {
  resolved: string;
  isHomePath: boolean;
  entity: {
    type: string;
    bundle: string;
    id: string;
    uuid: string;
    langcode: string;
    url: string;
    canonical: string;
  };
  jsonapi: {
    individual: string;
    resourceName: string;
    pathPrefix: string;
    basePath: string;
    entryPoint: string;
  };
  label: string;
  meta: Record<string, unknown>;
}

export interface DrupalResource {
  type: string;
  id: string;
  [key: string]: unknown;
}

export interface GetResourceByPathOptions {
  locale?: string;
  defaultLocale?: string;
  /** JSON:API include param — e.g. "field_blocchi,field_immagine" */
  include?: string;
  /** Additional JSON:API query params */
  params?: Record<string, string>;
  /** ISR revalidation time in seconds for the resource fetch (default: 60) */
  revalidate?: number;
}

export interface FetchJsonApiOptions {
  include?: string;
  params?: Record<string, string>;
  revalidate?: number;
}
