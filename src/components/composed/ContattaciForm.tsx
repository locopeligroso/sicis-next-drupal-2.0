'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/composed/Typography';

export function ContattaciForm() {
  const t = useTranslations('forms.contattaci');
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [privacy, setPrivacy] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!privacy) {
      setError(t('privacyError'));
      return;
    }
    setPending(true);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      email: data.get('email'),
      nome: data.get('nome'),
      messaggio: data.get('messaggio'),
      privacy: true,
    };

    try {
      const res = await fetch('/api/contattaci', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Errore invio');
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore invio');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <Typography textRole="h3" as="h2" className="mb-1">
        {t('title')}
      </Typography>
      <p className="text-sm text-muted-foreground mb-6">{t('description')}</p>

      {sent ? (
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <p className="text-lg font-medium">{t('success')}</p>
          <p className="text-sm text-muted-foreground">
            {t('successMessage')}
          </p>
        </div>
      ) : (
        <form
          id="contattaci-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contattaci-email">{t('email')} *</Label>
            <Input
              id="contattaci-email"
              name="email"
              type="email"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contattaci-nome">{t('nome')} *</Label>
            <Input id="contattaci-nome" name="nome" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contattaci-messaggio">{t('messaggio')}</Label>
            <Textarea
              id="contattaci-messaggio"
              name="messaggio"
              rows={4}
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="contattaci-privacy"
              checked={privacy}
              onCheckedChange={(checked) => setPrivacy(checked === true)}
            />
            <Label
              htmlFor="contattaci-privacy"
              className="text-sm leading-snug cursor-pointer"
            >
              {t('privacy')} *
            </Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? t('submitting') : t('submit')}
          </Button>
        </form>
      )}
    </div>
  );
}
