type RawResource = {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data: RawRef | RawRef[] | null }>;
};
type RawRef = { id: string; type: string };
type JsonApiSingleResponse = { data: RawResource; included?: RawResource[] };
type JsonApiCollectionResponse = {
  data: RawResource[];
  included?: RawResource[];
  meta?: { count?: number };
};

function buildIncludedMap(
  included: RawResource[] = [],
): Map<string, RawResource> {
  return new Map(included.map((r) => [`${r.type}:${r.id}`, r]));
}

function resolveResource(
  raw: RawResource,
  map: Map<string, RawResource>,
  depth = 0,
): Record<string, unknown> {
  // Guard against infinite recursion on circular includes
  if (depth > 5) return { id: raw.id, type: raw.type };

  const result: Record<string, unknown> = {
    id: raw.id,
    type: raw.type,
  };

  // Flatten attributes to top level
  for (const [k, v] of Object.entries(raw.attributes ?? {})) {
    result[k] = v;
  }

  // Resolve relationships from included map
  for (const [k, rel] of Object.entries(raw.relationships ?? {})) {
    if (!rel.data) {
      result[k] = null;
      continue;
    }
    if (Array.isArray(rel.data)) {
      result[k] = rel.data.map((ref) => {
        const inc = map.get(`${ref.type}:${ref.id}`);
        return inc ? resolveResource(inc, map, depth + 1) : ref;
      });
    } else {
      const inc = map.get(`${rel.data.type}:${rel.data.id}`);
      result[k] = inc ? resolveResource(inc, map, depth + 1) : rel.data;
    }
  }

  return result;
}

/** Deserialize a JSON:API single-resource response */
export function deserialize(
  response: JsonApiSingleResponse,
): Record<string, unknown> {
  const map = buildIncludedMap(response.included);
  return resolveResource(response.data, map);
}

/** Deserialize a JSON:API collection response */
export function deserializeCollection(response: JsonApiCollectionResponse): {
  items: Record<string, unknown>[];
  total: number;
} {
  const map = buildIncludedMap(response.included);
  return {
    items: response.data.map((r) => resolveResource(r, map)),
    total: response.meta?.count ?? response.data.length,
  };
}
