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

interface InfoProdottoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
}

export function InfoProdottoForm({ open, onOpenChange, productName }: InfoProdottoFormProps) {
  const t = useTranslations('forms.infoProdotto');
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
      prodotto: data.get('prodotto'),
      richiesta: data.get('richiesta'),
      privacy: true,
    };

    try {
      const res = await fetch('/api/info-prodotto', {
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
          <form id="info-prodotto-form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quote-email">{t('email')} *</Label>
              <Input id="quote-email" name="email" type="email" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quote-nome">{t('nome')} *</Label>
              <Input id="quote-nome" name="nome" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quote-cognome">{t('cognome')} *</Label>
              <Input id="quote-cognome" name="cognome" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quote-nazione">{t('nazione')}</Label>
              <Input id="quote-nazione" name="nazione" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quote-professione">{t('professione')}</Label>
              <Input id="quote-professione" name="professione" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quote-prodotto">{t('prodotto')}</Label>
              <Input
                id="quote-prodotto"
                name="prodotto"
                defaultValue={productName ?? ''}
                readOnly={!!productName}
                className={productName ? 'bg-muted' : ''}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quote-richiesta">{t('richiesta')}</Label>
              <Textarea id="quote-richiesta" name="richiesta" rows={4} />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="quote-privacy"
                checked={privacy}
                onCheckedChange={(checked) => setPrivacy(checked === true)}
              />
              <Label htmlFor="quote-privacy" className="text-sm leading-snug cursor-pointer">
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
