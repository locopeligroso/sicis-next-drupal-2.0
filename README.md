# sicis-next-drupal-2.0

Decoupled Next.js frontend for Sicis luxury mosaic brand, powered by Drupal 10 headless CMS.

## Prerequisites

- Node.js 18+
- npm
- Access to Drupal 10 backend

## Tech Stack

- **Next.js 16.1.7** (App Router)
- **React 19.2.4**
- **TypeScript** (strict mode)
- **Tailwind CSS 4.2.2**
- **next-intl** (i18n: IT, EN, FR, DE, ES, RU)
- **nuqs** (URL state management)
- **embla-carousel** (carousels)
- **Vitest** (unit testing)
- **Storybook 10.3.1** (not actively maintained)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local` with:

```env
# Drupal server-side URL (for API calls)
DRUPAL_BASE_URL=http://your-drupal-server/path

# Drupal public URL (for images/assets in browser)
NEXT_PUBLIC_DRUPAL_BASE_URL=http://your-drupal-server/path

# ISR revalidation secret (must match Drupal config)
REVALIDATE_SECRET=your_secret_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Build production bundle |
| `npm run storybook` | Storybook dev (localhost:6006) |
| `npx tsc --noEmit` | TypeScript check |
| `npx vitest run` | Run tests |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── [locale]/           # Locale-prefixed routes (6 languages)
│   │   ├── [...slug]/      # Catch-all Drupal content route
│   │   └── layout.tsx      # Fetches menus, renders Navbar + Footer
│   └── api/revalidate/     # ISR webhook endpoint
├── components/
│   ├── blocks/             # Page blocks (Spec* = product-specific, Gen* = paragraph-driven)
│   ├── composed/           # Reusable composed components
│   ├── layout/             # Navbar, NavbarDesktop, NavbarMobile
│   └── ui/                 # shadcn/ui primitives (do not modify)
├── components_legacy/      # Legacy components (being migrated)
│   └── blocks_legacy/      # ParagraphResolver + legacy Blocco* components
├── domain/
│   ├── filters/            # Filter registry, search params (nuqs)
│   └── routing/            # Routing registry, section config
├── lib/
│   ├── drupal/             # Drupal data layer (config, menu, image helpers)
│   ├── actions/            # Server actions (load-more-products)
│   └── navbar/             # Menu mapper for navbar structure
├── templates/
│   ├── nodes/              # Node templates (19 content types)
│   └── taxonomy/           # Taxonomy term templates
├── types/drupal/           # TypeScript entity interfaces
├── i18n/                   # Internationalization config
├── messages/               # Translation files (6 locales)
└── styles/                 # Global CSS with design tokens (OkLch)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DRUPAL_BASE_URL` | Yes | Drupal server-side URL for API calls |
| `NEXT_PUBLIC_DRUPAL_BASE_URL` | Yes | Drupal public URL for browser assets |
| `REVALIDATE_SECRET` | Yes | Secret for ISR revalidation endpoint |
