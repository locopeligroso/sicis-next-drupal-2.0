'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/composed/Typography';

/**
 * Error boundary for dynamic slug pages.
 *
 * Primary use case: ISR cold-start when Drupal is slow and the product
 * listing fetcher throws (instead of caching an empty result).
 * The user sees a retry prompt; on retry Drupal's Views cache is warm
 * and the page loads normally.
 */
export default function SlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[slug/error]', error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-(--spacing-page) pt-(--spacing-navbar)">
      <Typography textRole="h2" className="text-center">
        Contenuto in caricamento
      </Typography>
      <Typography
        textRole="body-lg"
        className="text-muted-foreground text-center max-w-md"
      >
        Il server sta preparando i dati. Riprova tra qualche secondo.
      </Typography>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Indietro
        </Button>
        <Button onClick={reset}>Riprova</Button>
      </div>
    </div>
  );
}
