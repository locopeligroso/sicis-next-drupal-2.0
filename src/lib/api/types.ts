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
  imageUrl: string | null;
  price: string | null;
  priceOnDemand: boolean;
  path: string | null;
}

// === V2: Filter Counts ===
export interface CountsResponse {
  counts: Record<string, number>;
}

// === V3/V4: Filter Options ===
export interface FilterOption {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  weight: number;
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
  uuid: string;
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
