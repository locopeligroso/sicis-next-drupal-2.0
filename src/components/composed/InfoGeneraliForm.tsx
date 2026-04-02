'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface InfoGeneraliFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InfoGeneraliForm({ open, onOpenChange }: InfoGeneraliFormProps) {
  const t = useTranslations('forms.infoGenerali');
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
      cognome: data.get('cognome'),
      nazione: data.get('nazione'),
      professione: data.get('professione'),
      richiesta: data.get('richiesta'),
      privacy: true,
    };

    try {
      const res = await fetch('/api/info-generali', {
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

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSent(false);
      setError(null);
      setPrivacy(false);
    }
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>

        {sent ? (
          <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-lg font-medium">{t('success')}</p>
            <p className="text-sm text-muted-foreground">{t('successMessage')}</p>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {t('close')}
            </Button>
          </div>
        ) : (
          <form id="info-generali-form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="info-email">{t('email')} *</Label>
              <Input id="info-email" name="email" type="email" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="info-nome">{t('nome')} *</Label>
              <Input id="info-nome" name="nome" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="info-cognome">{t('cognome')} *</Label>
              <Input id="info-cognome" name="cognome" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="info-nazione">{t('nazione')}</Label>
              <Input id="info-nazione" name="nazione" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="info-professione">{t('professione')}</Label>
              <Input id="info-professione" name="professione" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="info-richiesta">{t('richiesta')}</Label>
              <Textarea id="info-richiesta" name="richiesta" rows={4} />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="info-privacy"
                checked={privacy}
                onCheckedChange={(checked) => setPrivacy(checked === true)}
              />
              <Label htmlFor="info-privacy" className="text-sm leading-snug cursor-pointer">
                {t('privacy')} *
              </Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={pending}>
              {pending ? t('submitting') : t('submit')}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
