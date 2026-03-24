// Response wrapper for paginated listings
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// === V1: Products ===
export interface ProductCard {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;        // field_immagine_anteprima (preview for cards)
  imageUrlMain: string | null;    // field_immagine (full-size for detail page)
  price: string | null;
  priceOnDemand: string | null;   // Drupal returns "0", "1", or null
  path: string | null;
}

// === V2: Filter Counts ===
export interface CountsResponse {
  counts: Record<string, number>;
}

// === V3: Taxonomy Terms ===
// Actual REST response shape — no `path` or `slug` field
export interface TaxonomyTermItem {
  id: string;
  name: string;
  imageUrl: string;  // empty string when no image
  weight: string;    // Drupal returns weight as string
}

// === V5: Blog ===
export interface BlogCard {
  id: string;
  type: 'articolo' | 'news' | 'tutorial';
  title: string;
  imageUrl: string | null;
  path: string | null;
  created: string;
}

// === V6: Projects ===
export interface ProjectCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  category: string | null;
}

// === V7: Environments ===
export interface EnvironmentCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}

// === V8: Showrooms ===
export interface ShowroomCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  gmapsUrl: string | null;
  externalUrl: string | null;
}

// === V9: Documents ===
export interface DocumentCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  fileUrl: string | null;
  externalUrl: string | null;
  documentType: string | null;
  category: string | null;
}

// === V10: Subcategories ===
export interface CategoryCard {
  id: string;
  uuid: string | null;  // Drupal returns null for this field
  title: string;
  imageUrl: string | null;
  path: string | null;
}

// === V11: Pages by Category ===
export interface PageCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}

// === C1: Entity ===
export interface EntityResponse {
  meta: {
    type: 'node' | 'taxonomy_term';
    bundle: string;
    id: number;
    uuid: string;
    locale: string;
    path: string;
  };
  data: Record<string, unknown>;
}

// === C2: Translate Path ===
export interface TranslatePathResponse {
  translatedPath: string | null;
}
