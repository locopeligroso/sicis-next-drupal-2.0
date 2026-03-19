import { z } from 'zod';

const EnvSchema = z.object({
  DRUPAL_BASE_URL: z.string().url(),
  NEXT_PUBLIC_DRUPAL_BASE_URL: z.string().url(),
  REVALIDATE_SECRET: z.string().min(8),
});

// Valida env vars all'avvio — fallisce fast se mancano
function parseEnv() {
  const result = EnvSchema.safeParse({
    DRUPAL_BASE_URL: process.env.DRUPAL_BASE_URL,
    NEXT_PUBLIC_DRUPAL_BASE_URL: process.env.NEXT_PUBLIC_DRUPAL_BASE_URL,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
  });
  if (!result.success) {
    console.error(
      '[env] Missing or invalid environment variables:',
      result.error.flatten(),
    );
    // In dev: throw. In prod: log and use fallbacks.
    if (process.env.NODE_ENV === 'development')
      throw new Error('Invalid env vars');
  }
  return {
    DRUPAL_BASE_URL:
      process.env.DRUPAL_BASE_URL ??
      'http://192.168.86.201/www.sicis.com_aiweb/httpdocs',
    NEXT_PUBLIC_DRUPAL_BASE_URL:
      process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ??
      'http://192.168.86.201/www.sicis.com_aiweb/httpdocs',
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET ?? '',
  };
}

export const env = parseEnv();
