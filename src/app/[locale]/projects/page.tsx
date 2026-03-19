/**
 * EN alias for /progetti — re-exports the same page component.
 * Handles: /en/projects, /fr/projects, /de/projects, etc.
 * (Next.js App Router: this file handles /[locale]/projects)
 */
export { default, generateMetadata } from '../progetti/page';

export const revalidate = 300;
