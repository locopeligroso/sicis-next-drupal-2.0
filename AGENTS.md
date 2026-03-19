# AGENTS.md — Sicis Next.js Frontend

## Project Overview

**Decoupled Next.js 14 frontend** for Sicis brand CMS (Drupal 10 backend).

- **Frontend**: Next.js 14.2.29 App Router, TypeScript strict mode
- **Backend**: Drupal 10 @ `http://192.168.86.201/www.sicis.com_aiweb/httpdocs`
- **Data layer**: JSON:API + custom Menu API + translate-path endpoint
- **i18n**: next-intl (6 locales: it, en, fr, de, es, ru)
- **State**: nuqs for URL search params (filters)
- **Validation**: Zod schemas for all Drupal entities
- **Testing**: Vitest

```mermaid
graph TD
    Browser -->|HTTP| Next[Next.js 14\nlocalhost:3000]
    Next -->|JSON:API| Drupal[Drupal 10\n192.168.86.201]
    Next -->|Menu API| Drupal
    Next -->|translate-path| Drupal
    Next -->|ISR webhook| Drupal
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local:
# DRUPAL_BASE_URL=http://192.168.86.201/www.sicis.com_aiweb/httpdocs
# NEXT_PUBLIC_DRUPAL_BASE_URL=http://192.168.86.201/www.sicis.com_aiweb/httpdocs
# REVALIDATE_SECRET=your-secret-here

# Development server (http://localhost:3000)
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Production build
npm run build

# Start production server
npm start
```

**Prerequisites**: Node.js 18+, Drupal 10 backend running on LAN.

---

## ⚠️ Critical Rules (NON fare)

| ❌ NEVER | ✅ ALWAYS |
|---------|----------|
| Modify Drupal backend | Adapt frontend to Drupal's structure |
| Use pixel values (`px`) in styles | Use `rem`/`em`/`%`/`vw`/`vh` only |
| Fetch data client-side | Server-side data fetching only |
| Hardcode product listing slugs | Use `getSectionConfigAsync()` + registry |
| Compare slugs without normalization | `decodeURIComponent()` + NFC normalize before comparison |
| Add `output: 'standalone'` to next.config | Removed 19 Mar 2026 — don't re-add without reason |
| Use Docker for local dev | Docker removed — use `npm run dev` directly |
| Skip `deslugify` for filter values | Always deslugify before Drupal API calls |
| Mutate search params directly | Use nuqs `useQueryStates()` hook |
| Import from `next-drupal` | Package removed — use custom fetch layer |

---

## Architecture

### Stack Diagram

```mermaid
graph TB
    subgraph Frontend[Next.js 14 App Router]
        MW[middleware.ts\nlocale detection]
        Layout[layout.tsx\nHeader + Footer]
        Home[page.tsx\nHomepage]
        Slug[[...slug]/page.tsx\nCatch-all route]
        API[api/revalidate\nISR webhook]
    end
    
    subgraph Data[Data Layer]
        Fetch[drupalFetch\ntimeout 10s]
        Cache[React.cache\ndeduplication]
        ISR[ISR\n60s-3600s]
    end
    
    subgraph Components
        Nodes[17 node components]
        Paragraphs[17 paragraph files]
        Taxonomy[5 taxonomy components]
        Products[Product sub-components]
    end
    
    subgraph Drupal[Drupal 10 Backend]
        JSONAPI[JSON:API]
        MenuAPI[Menu API]
        TranslatePath[translate-path]
        Revalidate[sicis_revalidate module]
    end
    
    MW --> Layout
    Layout --> Home
    Layout --> Slug
    Slug --> Fetch
    Fetch --> Cache
    Cache --> JSONAPI
    Cache --> MenuAPI
    Cache --> TranslatePath
    Revalidate --> API
    API --> ISR
    Slug --> Nodes
    Slug --> Taxonomy
    Nodes --> Paragraphs
    Nodes --> Products
```

### Data Flow

1. **Request** → middleware detects locale → catch-all route
2. **Routing decision**: Check registry → listing or entity?
3. **Listing**: `getSectionConfigAsync()` → `ProductListing` + filters
4. **Entity**: `translatePath()` → Drupal entity → component map
5. **Render**: Server component → fetch data → React.cache → ISR
6. **Revalidation**: Drupal webhook → `/api/revalidate` → purge cache

---

## Routing System

### How It Works

```mermaid
flowchart TD
    URL[Incoming URL\ne.g. /it/mosaico] --> MW[middleware.ts\nlocale detection]
    MW --> SL[app/locale/...slug/page.tsx]
    SL --> RR{Is slug in\nregistry.listingSlugs?}
    RR -->|YES| SC[getSectionConfigAsync]
    RR -->|NO| TP[translatePath\nDrupal entity]
    SC --> PL[renderListingLayout\nProductListing + FilterSidebar]
    TP --> CM{Entity type?}
    CM -->|node--page| Page
    CM -->|node--prodotto_mosaico| ProdottoMosaico
    CM -->|node--articolo| Articolo
    CM -->|taxonomy_term--mosaico_collezioni| MosaicoCollezione
    CM -->|...| Other[Other components]
```

### Key Functions

| Function | Purpose | Cache |
|----------|---------|-------|
| `getRoutingRegistry()` | Fetch menu, build listing slugs map | ISR 600s |
| `getSectionConfigAsync()` | Get section config (productType, filters, etc.) | Uses registry |
| `translatePath()` | Resolve Drupal entity from URL alias | No cache (Drupal handles) |

### Product Type Anchors (Irriducibili)

```typescript
// src/domain/routing/section-config.ts
const PRODUCT_TYPE_ANCHORS = {
  mosaico: 'prodotto_mosaico',
  vetrite: 'prodotto_vetrite',
  arredo: 'prodotto_arredo',
  tessuto: 'prodotto_tessuto',
  pixall: 'prodotto_pixall',
} as const;
```

### Listing Slug Overrides

```typescript
// Fallback for Drupal collisions
const LISTING_SLUG_OVERRIDES: Record<string, string> = {
  'mosaico': 'prodotto_mosaico',
  'vetrite': 'prodotto_vetrite',
  // ... etc
};
```

**⚠️ Always normalize slugs**: `decodeURIComponent(slug).normalize('NFC')` before comparing with overrides.

---

## Content Types → Components

### Node Types

| Drupal Type | Component | Path |
|-------------|-----------|------|
| `node--page` | `Page` | `src/components/nodes/Page.tsx` |
| `node--prodotto_mosaico` | `ProdottoMosaico` | `src/components/nodes/ProdottoMosaico.tsx` |
| `node--prodotto_vetrite` | `ProdottoVetrite` | `src/components/nodes/ProdottoVetrite.tsx` |
| `node--prodotto_arredo` | `ProdottoArredo` | `src/components/nodes/ProdottoArredo.tsx` |
| `node--prodotto_tessuto` | `ProdottoTessuto` | `src/components/nodes/ProdottoTessuto.tsx` |
| `node--prodotto_pixall` | `ProdottoPixall` | `src/components/nodes/ProdottoPixall.tsx` |
| `node--articolo` | `Articolo` | `src/components/nodes/Articolo.tsx` |
| `node--news` | `News` | `src/components/nodes/News.tsx` |
| `node--tutorial` | `Tutorial` | `src/components/nodes/Tutorial.tsx` |
| `node--progetto` | `Progetto` | `src/components/nodes/Progetto.tsx` |
| `node--collezione` | `Collezione` | `src/components/nodes/Collezione.tsx` |
| `node--designer` | `Designer` | `src/components/nodes/Designer.tsx` |
| `node--evento` | `Evento` | `src/components/nodes/Evento.tsx` |
| `node--showroom` | `Showroom` | `src/components/nodes/Showroom.tsx` |
| `node--contatto` | `Contatto` | `src/components/nodes/Contatto.tsx` |
| `node--landing_page` | `LandingPage` | `src/components/nodes/LandingPage.tsx` |
| `node--form_page` | `FormPage` | `src/components/nodes/FormPage.tsx` |

### Taxonomy Types

| Drupal Type | Component | Path |
|-------------|-----------|------|
| `taxonomy_term--mosaico_collezioni` | `MosaicoCollezione` | `src/components/taxonomy/MosaicoCollezione.tsx` |
| `taxonomy_term--vetrite_collezioni` | `VetriteCollezione` | `src/components/taxonomy/VetriteCollezione.tsx` |
| `taxonomy_term--arredo_collezioni` | `ArredoCollezione` | `src/components/taxonomy/ArredoCollezione.tsx` |
| `taxonomy_term--tessuto_collezioni` | `TessutoCollezione` | `src/components/taxonomy/TessutoCollezione.tsx` |
| `taxonomy_term--pixall_collezioni` | `PixallCollezione` | `src/components/taxonomy/PixallCollezione.tsx` |

### Paragraph Types

15 paragraph components in `src/components/paragraphs/`:
- `BloccoTesto.tsx`, `BloccoImmagine.tsx`, `BloccoVideo.tsx`, `BloccoSlider.tsx`, etc.
- `ParagraphResolver.tsx` — maps Drupal paragraph type to component
- `SliderClient.tsx` — client-side slider wrapper

---

## Filter System

### Architecture

```mermaid
graph LR
    URL[URL search params] --> nuqs[nuqs\nuseQueryStates]
    nuqs --> Registry[FILTER_REGISTRY\nsource of truth]
    Registry --> Sidebar[FilterSidebar\nUI]
    Sidebar --> API[Drupal JSON:API\nfilter query]
    API --> Products[Product results]
```

### Filter Registry

**Source of truth**: `src/domain/filters/registry.ts`

```typescript
export const FILTER_REGISTRY = {
  prodotto_mosaico: {
    filters: [
      { id: 'collezione', label: 'Collezione', operator: 'IN' },
      { id: 'colore', label: 'Colore', operator: 'IN' },
      { id: 'materiale', label: 'Materiale', operator: 'IN' },
      { id: 'formato', label: 'Formato', operator: 'IN' },
      { id: 'finitura', label: 'Finitura', operator: 'IN' },
    ],
  },
  // ... other product types
};
```

### Filter Operators

| Operator | Drupal JSON:API | Use Case |
|----------|-----------------|----------|
| `IN` | `filter[field][operator]=IN&filter[field][value][]=A&filter[field][value][]=B` | Multi-select (collezione, colore) |
| `CONTAINS` | `filter[field][operator]=CONTAINS&filter[field][value]=keyword` | Text search |
| `BETWEEN` | `filter[field][operator]=BETWEEN&filter[field][value][0]=min&filter[field][value][1]=max` | Range (prezzo, dimensioni) |

### Deslugify Pattern

**⚠️ Always deslugify before Drupal API calls**:

```typescript
import { deslugify } from '@/lib/field-helpers';

// URL: /it/mosaico?colore=blu-notte,oro-24k
const slugs = ['blu-notte', 'oro-24k'];
const values = slugs.map(deslugify); // ['Blu Notte', 'Oro 24K']

// Use values in Drupal filter
const params = new DrupalJsonApiParams()
  .addFilter('field_colore.name', 'IN', values);
```

**⚠️ Always decode before deslugify**:

```typescript
// URL: /it/mosaico?collezione=citt%C3%A0-eterna
const encoded = 'citt%C3%A0-eterna';
const decoded = decodeURIComponent(encoded); // 'città-eterna'
const value = deslugify(decoded); // 'Città Eterna'
```

---

## ISR & Caching

### ISR Times (src/config/isr.ts)

| Resource | Revalidate | Rationale |
|----------|------------|-----------|
| `PRODUCTS` | 60s | High-traffic, frequent updates |
| `EDITORIAL` | 300s | News, articles, tutorials |
| `PAGES` | 600s | Static pages, low churn |
| `TAXONOMY` | 3600s | Collections, categories (stable) |
| `MENU` | 600s | Navigation structure |
| `FILTER_OPTIONS` | 3600s | Filter values (stable) |

### React.cache Pattern

```typescript
import { cache } from 'react';
import { drupalFetch } from '@/lib/drupal';

export const fetchProducts = cache(async (productType: string, locale: string) => {
  const url = `${DRUPAL_BASE_URL}/${locale}/jsonapi/node/${productType}`;
  const data = await drupalFetch(url, {
    next: { revalidate: ISR_TIMES.PRODUCTS },
  });
  return data;
});
```

**✅ Benefits**:
- Deduplicates identical requests in same render pass
- Works with Next.js ISR
- Type-safe with Zod validation

### Fetch Layer

| Function | Purpose | Cache | ISR |
|----------|---------|-------|-----|
| `drupalFetch()` | Base wrapper, timeout 10s | No | Configurable |
| `fetchProducts()` | Product listing | React.cache | 60s |
| `fetchMenu()` | Navigation menu | React.cache | 600s |
| `fetchFilterOptions()` | Filter values | React.cache | 3600s |
| `fetchParagraph()` | Paragraph entity | React.cache | 600s |

---

## i18n (next-intl)

### Locales

```typescript
// src/i18n/config.ts
export const locales = ['it', 'en', 'fr', 'de', 'es', 'ru'] as const;
export const defaultLocale = 'it';
```

### URL Structure

```
/it/mosaico              → Italian listing
/en/mosaic               → English listing (Drupal translates slug)
/fr/mosaique             → French listing
/it/prodotti/oro-24k     → Italian product detail
/en/products/24k-gold    → English product detail
```

### Translation Pattern

```typescript
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations('ProductListing');
  
  return <h1>{t('title')}</h1>;
}
```

**Translation files**: `messages/[locale].json`

```json
{
  "ProductListing": {
    "title": "Prodotti",
    "filters": "Filtri",
    "noResults": "Nessun risultato"
  }
}
```

---

## File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx          # Root layout (Header + Footer + i18n)
│   │   │   ├── page.tsx            # Homepage (field_page_id=homepage)
│   │   │   ├── not-found.tsx       # 404 page
│   │   │   ├── error.tsx           # Error boundary
│   │   │   └── [...slug]/
│   │   │       └── page.tsx        # Catch-all route (all Drupal URLs)
│   │   └── api/
│   │       └── revalidate/
│   │           └── route.ts        # ISR webhook endpoint
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # use client, dynamic menu
│   │   │   ├── Footer.tsx          # server component, dynamic menu
│   │   │   ├── LanguageSwitcher.tsx # use client, server action getTranslatedPath
│   │   │   └── MegaMenu.tsx        # use client, mega-menu panel
│   │   ├── nodes/                  # 17 content type components
│   │   ├── paragraphs/             # 17 files (15 components + resolver + slider)
│   │   ├── taxonomy/               # 5 taxonomy term components
│   │   ├── products/               # Product sub-components (ColorSwatches, Documents, Specs)
│   │   └── ui/                     # Skeleton loaders (FilterSidebarSkeleton, ProductListingSkeleton)
│   ├── config/                     # Centralized configuration
│   │   ├── drupal.ts               # DRUPAL_BASE_URL, DRUPAL_ORIGIN
│   │   ├── env.ts                  # Zod schema for env vars validation
│   │   └── isr.ts                  # ISR times (PRODUCTS=60s, PAGES=600s, TAXONOMY=3600s)
│   ├── domain/                     # Business logic (framework-agnostic)
│   │   ├── filters/
│   │   │   ├── registry.ts         # FILTER_REGISTRY (source of truth)
│   │   │   └── search-params.ts    # nuqs integration
│   │   └── routing/
│   │       └── section-config.ts   # getSectionConfig, LISTING_SLUG_OVERRIDES
│   ├── hooks/
│   │   ├── use-filter-sync.ts
│   │   └── useFilters.ts
│   ├── i18n/
│   │   ├── config.ts               # locales + defaultLocale
│   │   └── request.ts              # next-intl server config
│   ├── lib/                        # Fetch layer & utilities
│   │   ├── fetch-filter-options.ts
│   │   ├── fetch-menu.ts
│   │   ├── fetch-paragraph.ts
│   │   ├── fetch-products.ts
│   │   ├── field-helpers.ts
│   │   ├── get-resource-by-path.ts
│   │   ├── get-translated-path.ts  # Server action for language switching
│   │   ├── image-helpers.ts
│   │   ├── node-resolver.ts        # Content type → component + ISR time mapping
│   │   └── product-helpers.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── product.module.css
│   ├── types/
│   │   └── drupal/
│   │       ├── base.ts             # Zod schemas base
│   │       ├── entities.ts         # NodeTypeName, TaxonomyTypeName, DrupalEntity
│   │       └── products/           # Zod schemas for each product type
│   ├── api/
│   │   ├── client.ts               # drupalFetch wrapper
│   │   ├── jsonapi/                # Deserializer + query-builder
│   │   └── resources/              # Typed product fetch
│   └── middleware.ts               # Locale detection
├── messages/                       # next-intl translations (it, en, fr, de, es, ru)
├── public/
├── next.config.mjs
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Key Conventions

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProdottoMosaico.tsx` |
| Utilities/libs | camelCase | `drupal.ts`, `node-resolver.ts` |
| Types | PascalCase with prefix | `NodePage`, `TermMosaicoCollezione` |
| Hooks | camelCase with `use` prefix | `useFilters.ts` |
| Server actions | camelCase | `getTranslatedPath` |

### Imports

```typescript
// ✅ Use path alias
import { drupalFetch } from '@/lib/drupal';
import { Page } from '@/components/nodes/Page';

// ❌ Avoid relative imports for cross-directory
import { drupalFetch } from '../../lib/drupal';
```

### TypeScript

```typescript
// ✅ Strict mode enabled
// ✅ Use Zod for runtime validation
import { z } from 'zod';

const NodePageSchema = z.object({
  type: z.literal('node--page'),
  id: z.string().uuid(),
  attributes: z.object({
    title: z.string(),
    // ...
  }),
});

type NodePage = z.infer<typeof NodePageSchema>;

// ✅ Validate Drupal responses
const data = NodePageSchema.parse(response.data);
```

### Styling

```typescript
// ✅ Wireframe phase — inline styles with relative units
<div style={{ 
  padding: '2rem',
  maxWidth: '80rem',
  margin: '0 auto',
  fontSize: '1.125rem',
  lineHeight: '1.6'
}}>

// ❌ NEVER use pixels
<div style={{ padding: '32px' }}> // ❌

// ✅ Tailwind available for future design phase (not used yet)
<div className="p-8 max-w-7xl mx-auto">
```

---

## Common Patterns

### 1. Fetch Drupal Entity

```typescript
import { drupalFetch } from '@/lib/drupal';
import { ISR_TIMES } from '@/config/isr';

export async function fetchNode(id: string, locale: string) {
  const url = `${process.env.DRUPAL_BASE_URL}/${locale}/jsonapi/node/page/${id}`;
  
  const response = await drupalFetch(url, {
    next: { revalidate: ISR_TIMES.PAGES },
  });
  
  return response.data;
}
```

### 2. Build JSON:API Query

```typescript
import { DrupalJsonApiParams } from 'drupal-jsonapi-params';

const params = new DrupalJsonApiParams()
  .addFilter('status', '1')
  .addFilter('field_collezione.name', 'IN', ['Oro 24K', 'Platino'])
  .addSort('created', 'DESC')
  .addInclude(['field_immagine', 'field_collezione'])
  .addFields('node--prodotto_mosaico', [
    'title',
    'field_codice',
    'field_immagine',
    'field_collezione',
  ]);

const url = `${DRUPAL_BASE_URL}/${locale}/jsonapi/node/prodotto_mosaico?${params.getQueryString()}`;
```

### 3. Server Component with ISR

```typescript
import { fetchProducts } from '@/lib/fetch-products';

export default async function ProductListingPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const products = await fetchProducts('prodotto_mosaico', locale);
  
  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### 4. Client Component with URL State

```typescript
'use client';

import { useQueryStates } from 'nuqs';
import { filterParsers } from '@/domain/filters/search-params';

export default function FilterSidebar() {
  const [filters, setFilters] = useQueryStates(filterParsers);
  
  const handleFilterChange = (filterId: string, values: string[]) => {
    setFilters({ [filterId]: values.length > 0 ? values : null });
  };
  
  return (
    <div>
      {/* Filter UI */}
    </div>
  );
}
```

### 5. Deslugify Filter Values

```typescript
import { deslugify } from '@/lib/field-helpers';

// URL: /it/mosaico?colore=blu-notte,oro-24k
const colorSlugs = searchParams.colore?.split(',') || [];
const colorValues = colorSlugs.map((slug) => 
  deslugify(decodeURIComponent(slug))
); // ['Blu Notte', 'Oro 24K']

// Use in Drupal filter
const params = new DrupalJsonApiParams()
  .addFilter('field_colore.name', 'IN', colorValues);
```

### 6. Get Section Config

```typescript
import { getSectionConfigAsync } from '@/domain/routing/section-config';

const slug = 'mosaico';
const locale = 'it';

const config = await getSectionConfigAsync(slug, locale);

if (config) {
  const { productType, filters, title } = config;
  // Render listing with filters
} else {
  // Not a listing — fetch entity via translatePath
}
```

### 7. Translate Path (Drupal Entity)

```typescript
import { getResourceByPath } from '@/lib/get-resource-by-path';

const path = '/prodotti/oro-24k';
const locale = 'it';

const resource = await getResourceByPath(path, locale);

if (resource) {
  const { type, id } = resource;
  // Fetch full entity and render component
} else {
  notFound();
}
```

### 8. Image Helper

```typescript
import { getImageUrl } from '@/lib/image-helpers';

const imageUrl = getImageUrl(
  node.field_immagine,
  'large' // Image style
);

<img src={imageUrl} alt={node.title} />
```

---

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Test files**: `*.test.ts` or `*.test.tsx` co-located with source files.

---

## Deployment

**Production build**:

```bash
npm run build
npm start
```

**Environment variables** (production):

```env
DRUPAL_BASE_URL=https://www.sicis.com
NEXT_PUBLIC_DRUPAL_BASE_URL=https://www.sicis.com
REVALIDATE_SECRET=your-production-secret
```

**ISR webhook** (Drupal module `sicis_revalidate`):

```http
POST /api/revalidate
Authorization: Bearer your-production-secret
Content-Type: application/json

{
  "path": "/it/prodotti/oro-24k"
}
```

---

## Troubleshooting

### Issue: "Failed to fetch from Drupal"

**Check**:
1. Drupal backend is running (`http://192.168.86.201/www.sicis.com_aiweb/httpdocs`)
2. `DRUPAL_BASE_URL` is correct in `.env.local`
3. Network connectivity (ping `192.168.86.201`)

### Issue: "Filters not working"

**Check**:
1. Filter values are deslugified before Drupal API call
2. URL params are decoded (`decodeURIComponent`) before deslugify
3. Filter operator matches Drupal field type (IN for taxonomy, CONTAINS for text)

### Issue: "Routing to wrong component"

**Check**:
1. Slug is in `registry.listingSlugs` → should render listing
2. Slug is NOT in registry → should call `translatePath` → entity component
3. `LISTING_SLUG_OVERRIDES` has correct mapping for collision cases

### Issue: "ISR not revalidating"

**Check**:
1. Webhook secret matches `REVALIDATE_SECRET` in `.env.local`
2. Drupal module `sicis_revalidate` is enabled
3. Webhook is using `Authorization: Bearer <secret>` header (not query string)

---

## Resources

- **Next.js 14 Docs**: https://nextjs.org/docs
- **next-intl**: https://next-intl-docs.vercel.app/
- **nuqs**: https://nuqs.47ng.com/
- **drupal-jsonapi-params**: https://www.npmjs.com/package/drupal-jsonapi-params
- **Drupal JSON:API**: https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module
- **Zod**: https://zod.dev/

---

## Contact

For questions about this project, refer to:
- **Main project docs**: `/Users/dev10/Sites/sicis-next-drupal/docs/`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Filtering system**: `docs/filtering-system.md`
- **Routing**: `docs/routing-and-url-aliases.md`
