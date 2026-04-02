'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { MailIcon } from 'lucide-react';
import { InfoGeneraliForm } from '@/components/composed/InfoGeneraliForm';

export function ContactCta() {
  const t = useTranslations('common');
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="flex justify-center">
        <Button size="lg" onClick={() => setOpen(true)}>
          <MailIcon data-icon="inline-start" />
          {t('contactUs')}
        </Button>
      </div>
      <InfoGeneraliForm open={open} onOpenChange={setOpen} />
    </>
  );
}
