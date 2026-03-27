# SICIS Vetrite Next — Reference Documentation

> **Status:** Standalone prototype. No code sharing with `sicis-next-drupal-2.0`.
> **Location:** `~/Sites/sicis-vetrite-next`

---

## Overview

`sicis-vetrite-next` is a standalone, single-page interactive 3D product showcase for the Sicis Vetrite decorative glass slab line — specifically the "Reef" product from the "Gem Glass" collection. It provides a real-time WebGL material viewer built with React Three Fiber, enabling users to explore three glass finishes (Solid, Chrome, Opalescent) with real-time lighting, environment mapping, and PBR material properties.

This is **not** a production e-commerce page. It is a rich media prototype: all data is static and hardcoded, there is no Drupal connection, no API integration, and no i18n layer.

---

## Relationship to `sicis-next-drupal-2.0`

| Aspect     | sicis-vetrite-next                       | sicis-next-drupal-2.0                  |
| ---------- | ---------------------------------------- | -------------------------------------- |
| Purpose    | Interactive 3D demo for a single product | Full e-commerce site (6 product types) |
| Data       | Static, hardcoded in `data/` files       | Drupal REST API (20+ endpoints)        |
| Language   | JavaScript (JSX) — no TypeScript         | TypeScript                             |
| Styling    | CSS custom properties (Figma tokens)     | Tailwind 4 + design tokens             |
| i18n       | None (English only)                      | 7 locales (it, en, fr, de, es, ru, us) |
| 3D         | React Three Fiber + Three.js             | None                                   |
| State      | Zustand                                  | nuqs (URL state)                       |
| Routing    | Single page                              | Dynamic `[locale]/[...slug]`           |
| Deployment | Standalone (Vercel)                      | Standalone (Vercel)                    |

The only shared element is the Figma design token methodology — both projects use the same token naming conventions but implement them independently (`globals.css` here, `Tailwind 4 + globals.css` in the main project).

---

## Tech Stack

| Category         | Technology                                                         |
| ---------------- | ------------------------------------------------------------------ |
| Framework        | Next.js 16.2.1 (App Router, Turbopack)                             |
| React            | 19.2.4                                                             |
| 3D Rendering     | Three.js r183 + React Three Fiber 9.5.0 + Drei 10.7.7              |
| State Management | Zustand 5.0.12                                                     |
| Styling          | CSS custom properties (Figma Design System tokens)                 |
| Debug            | Leva 0.10.1 (visible with `#debug` URL hash)                       |
| Animation        | maath 0.10.8 (easing/slerp)                                        |
| Testing          | Playwright 1.58.2                                                  |
| Language         | Pure JavaScript (JSX) — no TypeScript                              |
| Module System    | ES Modules, `.js` extensions, `@/*` path alias via `jsconfig.json` |

---

## Scripts

| Command         | Effect                                     |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Dev server with Turbopack (localhost:3000) |
| `npm run build` | Production build                           |
| `npm run start` | Serve production build                     |

---

## Directory Structure

```
sicis-vetrite-next/
├── app/
│   ├── layout.jsx              Root layout, metadata
│   ├── page.jsx                Entry ('use client'), lazy-loads below-fold sections
│   └── globals.css             Figma design tokens (~70KB)
│
├── components/
│   ├── canvas/                 React Three Fiber scene
│   │   ├── GalleryCubeCanvas.jsx   R3F <Canvas>, pre-warms all materials
│   │   ├── Slab.jsx                Dual slab geometry + mirror animation
│   │   ├── SceneEnvironment.jsx    HDRI loading + env map propagation
│   │   ├── SceneLights.jsx         Ambient, key, fill, opal backlight
│   │   ├── ShadowPlane.jsx         Shadow catcher mesh
│   │   ├── RendererSync.jsx        Syncs tone mapping/exposure to WebGL
│   │   ├── MirrorButton.jsx        Toggle mirrored slab
│   │   ├── OpalToggle.jsx          Switch OpalOff ↔ OpalOn
│   │   ├── BacklightSelector.jsx   Opal emissive presets
│   │   ├── FullscreenButton.jsx    Canvas fullscreen mode
│   │   ├── DebugPanel.jsx          Leva panel (visible with #debug)
│   │   └── ErrorBoundary.jsx       Canvas error fallback
│   │
│   ├── hero/                   Hero section (above fold)
│   │   ├── HeroSection.jsx
│   │   ├── ImageArea.jsx           Canvas wrapper
│   │   ├── FinishSelector.jsx      Finish tabs (Solid, Chrome, OpalOff, OpalOn)
│   │   ├── TitleBlock.jsx          Product name + collection
│   │   ├── Description.jsx
│   │   ├── CTAs.jsx                Contact, Get Quote, Request Sample
│   │   ├── PurchaseBar.jsx         Pricing, stock, delivery
│   │   ├── InfoPanel.jsx           Spec cards, dimensions, thickness
│   │   ├── Breadcrumb.jsx
│   │   └── GalleryColumn.jsx       Right column: finish gallery
│   │
│   ├── details/                Below-fold cards (lazy-loaded)
│   │   ├── DetailsSection.jsx
│   │   ├── OpalescentCard.jsx
│   │   ├── MaintenanceCard.jsx
│   │   ├── ApplicationsCard.jsx
│   │   └── ExtraCard.jsx
│   │
│   ├── sections/               Below-fold content (lazy-loaded)
│   │   ├── AmbientGallery.jsx
│   │   ├── RelatedProducts.jsx
│   │   ├── Downloads.jsx
│   │   └── ResourcesAlt.jsx
│   │
│   └── specs/
│       └── ProductSpecs.jsx    Dimension, thickness, durability specs
│
├── hooks/
│   ├── useSlabMaterial.js      Active finish material (store + service + texture)
│   ├── useGlassMaterial.js     Glass material getter
│   ├── useFinishTexture.js     Load texture, sync to MaterialService
│   ├── useMouseTracking.js     Slerp-based mouse-follow rotation
│   ├── useSyncCanvasToBar.js   Height sync between canvas and purchase bar
│   ├── useResizeObserver.js    Element size observation
│   └── useFullscreen.js        Browser fullscreen API
│
├── stores/
│   ├── useMaterialStore.js     Scene state (finish, HDRI, lights, colors, mirror)
│   └── useMaterialService.js   Material cache + lifecycle management
│
├── three/
│   ├── sceneConfig.js          Barrel export (single import point for all config)
│   ├── MaterialFactory.js      create(id) → material instance
│   ├── materials/
│   │   ├── SolidMaterial.js    MeshPhysicalMaterial (colored laminate)
│   │   ├── ChromeMaterial.js   MeshStandardMaterial (metallic)
│   │   ├── OpalMaterial.js     MeshPhysicalMaterial + emissive modes
│   │   └── GlassMaterial.js    MeshPhysicalMaterial (transmission=1.0)
│   └── config/
│       ├── camera.js, renderer.js, environment.js, lights.js
│       ├── geometry.js, materials.js, animation.js, assets.js
│       └── debug.js, ui.js
│
├── data/                       Static product data — no API calls
│   ├── product.js              PRODUCT_META, PRODUCT_PRICING, BREADCRUMB_ITEMS
│   ├── gallery.js              Ambient gallery slides
│   ├── products.js             Related products
│   └── resources.js            Download links
│
├── public/assets/              HDRI maps (13× .hdr), textures, images
├── next.config.mjs             transpilePackages: three, r3f, drei, maath
├── jsconfig.json               @/* path alias
├── figma-manifest.json         Figma design export metadata
└── CLAUDE.md                   Architecture guide
```

---

## Architecture

### Rendering Pipeline

```
app/page.jsx ('use client' root)
  ├── Breadcrumb
  ├── HeroSection
  │   ├── InfoPanel (product info + PurchaseBar)
  │   └── GalleryColumn → ImageArea → ClientCanvas
  │       └── GalleryCubeCanvas (R3F Canvas)
  │           ├── RendererSync (store → gl.toneMapping)
  │           ├── SceneEnvironment (HDRI loader)
  │           ├── SceneLights
  │           ├── ShadowPlane
  │           └── Slab (original + mirror meshes)
  └── Suspense (lazy-loaded)
      ├── ProductSpecs
      ├── DetailsSection
      ├── ResourcesAlt / Downloads
      ├── AmbientGallery
      └── RelatedProducts
```

The `app/page.jsx` root is a `'use client'` component. Below-fold sections are code-split with `React.lazy` + `Suspense` to keep the initial bundle small. The 3D canvas is isolated inside `GalleryCubeCanvas` so WebGL context errors are caught by `ErrorBoundary` without crashing the page.

### Material System — Factory + Service Pattern

The material system follows a strict layered hierarchy:

| Layer            | File                                  | Responsibility                                                        |
| ---------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Config           | `three/config/materials.js`           | PBR parameter objects (roughness, metalness, transmission, etc.)      |
| Material classes | `three/materials/*.js`                | Extend `MeshPhysicalMaterial` / `MeshStandardMaterial`                |
| Factory          | `three/MaterialFactory.js`            | `create(id)` → returns a material instance                            |
| Service          | `stores/useMaterialService.js`        | Zustand-managed cache; env map + texture propagation; lifecycle       |
| Store            | `stores/useMaterialStore.js`          | Global scene state: `activeFinish`, HDRI, lights, colors, mirror flag |
| Hooks            | `useSlabMaterial`, `useGlassMaterial` | Composable getters used by `Slab` and canvas components               |

**Finish IDs:** `'Solid'`, `'Chrome'`, `'OpalOff'`, `'OpalOn'`, `'Glass'` (Glass is always-on, applied to the front face of all slabs).

### State Flow

```
useMaterialStore (Zustand)
  → RendererSync      (syncs toneMapping / exposure to WebGL gl context)
  → SceneEnvironment  (HDRI loader, env map propagation to all materials)
  → SceneLights       (adjusts light intensities per-finish)
  → useMaterialService (color / emissive updates pushed to cached material instances)
  → Three.js WebGL render
```

All scene configuration is centralised in `three/sceneConfig.js` (barrel export). Always import from this barrel — never import directly from sub-config files.

### Key Implementation Patterns

**Material pre-warming.** All 4 finishes + glass are instantiated at canvas mount time. This forces shader compilation before user interaction, preventing visible hitches when switching finishes.

**`dispose={null}` on R3F meshes.** React Three Fiber's default behaviour auto-disposes materials when a mesh unmounts. Setting `dispose={null}` delegates lifecycle entirely to `useMaterialService`, which manages the shared material cache explicitly.

**Mouse tracking via quaternion slerp.** `useMouseTracking` uses maath's slerp utilities to smoothly interpolate the slab's quaternion toward the mouse-driven target rotation. This avoids gimbal lock and produces naturally smooth tracking.

**Mirror animation via `damp()`.** The dual-slab mirror effect uses maath's `easing.damp()` function for spring-like physics. The mirror toggle drives a target position; `damp()` smooths the transition each frame.

**HDRI auto-switch on finish change.** A mapping table inside `SceneEnvironment` (or `useMaterialStore`) maps each finish ID to its optimal HDRI. When `activeFinish` changes in the store, the HDRI loads automatically.

**Debug panel via URL hash.** Leva's debug panel is only mounted when `window.location.hash === '#debug'`. This keeps the production build clean without needing an env variable.

### HDRI Environments (13 total)

| Name                   | Notes               |
| ---------------------- | ------------------- |
| `RR`                   | Default (apartment) |
| `studio007`            |                     |
| `studio_small_03`      |                     |
| `studio_small_06`      |                     |
| `studio_small_08`      |                     |
| `studio_small_09`      |                     |
| `photo_studio_01`      |                     |
| `white_studio_03`      |                     |
| `glasshouse_interior`  |                     |
| `sculpture_exhibition` |                     |
| `glass_passage`        |                     |
| `ferndale_studio_06`   |                     |
| `loft_interior`        |                     |

All `.hdr` files live in `public/assets/`.

---

## Data Layer

All product data is static and embedded in the `data/` directory. There are no API calls, no Drupal connection, and no server-side data fetching.

| File                | Contents                                                                              |
| ------------------- | ------------------------------------------------------------------------------------- |
| `data/product.js`   | `PRODUCT_META` (name, collection, description), `PRODUCT_PRICING`, `BREADCRUMB_ITEMS` |
| `data/gallery.js`   | Ambient gallery slide definitions                                                     |
| `data/products.js`  | Related product cards                                                                 |
| `data/resources.js` | Download link definitions                                                             |

---

## Styling

Styling uses CSS custom properties generated from Figma design tokens, defined in `app/globals.css` (~70KB). There is no Tailwind, no CSS-in-JS, and no CSS Modules.

**Token categories:**

| Category    | Details                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| Colors      | Surfaces (1–5), accent scale                                              |
| Spacing     | `--spacing-inline`, `--spacing-page`, `--spacing-stack`, `--spacing-grid` |
| Typography  | 12 size steps; `Inter` for body, `Satoshi` for headings                   |
| Breakpoints | Single responsive breakpoint (mobile-first)                               |

The token naming convention is shared with `sicis-next-drupal-2.0` (same Figma source), but the implementation files are independent.

---

## Git

- **Branch:** `next`
- **Remote:** none configured
- **Commits:** 2 (initial Next.js 16 migration + config refactor)
- **Working tree:** clean

---

## Debug

Append `#debug` to the URL to activate the Leva debug panel. This exposes live controls for material parameters, lighting, tone mapping, and exposure. No environment variable is required.

---

## What This Project Is Not

- It is not connected to Drupal or any CMS.
- It does not use the REST endpoints documented in `DRUPAL_API_CATALOG.md`.
- It does not share components, hooks, or utilities with `sicis-next-drupal-2.0`.
- It is not internationalised — all strings are English and hardcoded.
- It is not the production product detail page for Vetrite on the Sicis website.
