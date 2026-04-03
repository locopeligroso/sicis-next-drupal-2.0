import { getTranslations } from 'next-intl/server';
import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';
import { getTitle } from '@/lib/field-helpers';
import { ContattaciForm } from '@/components/composed/ContattaciForm';

export default async function Contatti({
  node,
}: {
  node: Record<string, unknown>;
}) {
  const t = await getTranslations('contacts');
  const title = getTitle(node);
  const paragraphs =
    (node.field_blocchi as Record<string, unknown>[] | undefined) ?? [];

  return (
    <article className="flex flex-col gap-(--spacing-section) overflow-x-hidden [&>*]:w-full">
      {/* ── Two-column contact info ── */}
      <section className="max-w-main mx-auto w-full px-(--spacing-page)">
        <div className="grid grid-cols-1 gap-(--spacing-section) lg:grid-cols-2">
          {/* LEFT — company identity */}
          <div className="flex flex-col gap-(--spacing-content)">
            <h1 className="font-heading text-4xl font-light tracking-tight lg:text-5xl">
              {t('heroTitle')}
            </h1>

            <address className="not-italic text-sm leading-relaxed">
              <p className="font-semibold text-base mb-1">SICIS s.r.l.</p>
              <p>Via Borgonuovo 29, 20121 Milan (Italy)</p>
            </address>

            <dl className="text-sm leading-relaxed space-y-0.5 text-muted-foreground">
              <div>
                <dt className="sr-only">Share capital</dt>
                <dd>Share capital &euro; 5.000.000 fully deposited</dd>
              </div>
              <div>
                <dt className="sr-only">Fiscal Code</dt>
                <dd>Fiscal Code 01611790401</dd>
              </div>
              <div>
                <dt className="sr-only">VAT Registration</dt>
                <dd>VAT Registration no. IT01267680393</dd>
              </div>
              <div>
                <dt className="sr-only">Company Reg.</dt>
                <dd>Company Reg. Ravenna 01611790401</dd>
              </div>
              <div>
                <dt className="sr-only">REA</dt>
                <dd>Rea MI 1729065</dd>
              </div>
            </dl>
          </div>

          {/* RIGHT — contact details */}
          <div className="flex flex-col gap-(--spacing-content)">
            {/* Recapiti */}
            <section aria-labelledby="recapiti-heading">
              <h2
                id="recapiti-heading"
                className="font-heading text-xs font-semibold uppercase tracking-widest mb-3"
              >
                {t('recapiti')}
              </h2>
              <dl className="text-sm leading-relaxed space-y-1.5">
                <div className="flex gap-2">
                  <dt className="uppercase font-semibold text-xs tracking-wider w-20 shrink-0 pt-px">
                    {t('phone')}
                  </dt>
                  <dd>
                    <a
                      href="tel:+390544469711"
                      className="hover:underline underline-offset-(--underline-offset)"
                    >
                      +39 0544 469711
                    </a>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="uppercase font-semibold text-xs tracking-wider w-20 shrink-0 pt-px">
                    {t('fax')}
                  </dt>
                  <dd>+39 0544 469811</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="uppercase font-semibold text-xs tracking-wider w-20 shrink-0 pt-px">
                    {t('email')}
                  </dt>
                  <dd>
                    <a
                      href="mailto:info@sicis.com"
                      className="hover:underline underline-offset-(--underline-offset)"
                    >
                      info@sicis.com
                    </a>
                  </dd>
                </div>
              </dl>
            </section>

            {/* Showroom e magazzino */}
            <section aria-labelledby="showroom-heading">
              <h2
                id="showroom-heading"
                className="font-heading text-xs font-semibold uppercase tracking-widest mb-3"
              >
                {t('showroomWarehouse')}
              </h2>
              <dl className="text-sm leading-relaxed">
                <div className="flex gap-2">
                  <dt className="uppercase font-semibold text-xs tracking-wider w-20 shrink-0 pt-px">
                    {t('address')}
                  </dt>
                  <dd>
                    <address className="not-italic">
                      Via Canala 85, 48123 Ravenna (Italy)
                    </address>
                  </dd>
                </div>
              </dl>
            </section>

            {/* Form contatto — gestito da Gabriele */}
          </div>
        </div>
      </section>

      {/* ── Paragraph blocks from Drupal ── */}
      {paragraphs.map((p, i) => (
        <ParagraphResolver
          key={(p.id as string) ?? i}
          paragraph={p}
          pageTitle={title ?? undefined}
        />
      ))}

      {/* ── Contact form ── */}
      <section className="max-w-main mx-auto w-full px-(--spacing-page) py-(--spacing-section)">
        <ContattaciForm />
      </section>
    </article>
  );
}
