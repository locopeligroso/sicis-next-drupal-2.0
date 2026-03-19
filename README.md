# sicis-next-drupal-2.0

Decoupled Next.js 14 frontend for Sicis luxury mosaic brand, powered by Drupal 10 headless CMS.

## Prerequisites

- Node.js 18+
- npm or yarn
- Access to Drupal 10 backend (JSON:API enabled)

## Tech Stack

- **Next.js 14.2.29** (App Router)
- **TypeScript** (strict mode)
- **next-intl** (i18n: it, en, fr, de, es, ru)
- **nuqs** (URL state management)
- **Zod** (schema validation)
- **Tailwind CSS v4**
- **Vitest** (unit testing)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set:

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
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler check |

## Testing

Run tests with Vitest:

```bash
npx vitest
```

Run tests with UI:

```bash
npx vitest --ui
```

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Utilities and API clients
├── i18n/             # Internationalization config
└── types/            # TypeScript type definitions
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DRUPAL_BASE_URL` | Yes | Drupal server-side URL for API calls |
| `NEXT_PUBLIC_DRUPAL_BASE_URL` | Yes | Drupal public URL for browser assets |
| `REVALIDATE_SECRET` | Yes | Secret for ISR revalidation endpoint |

## License

Proprietary — Sicis S.p.A.
