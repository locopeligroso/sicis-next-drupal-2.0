'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, Trash2Icon } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useSampleCart } from '@/domain/sample-cart/SampleCartProvider';
import {
  calculateShippingCost,
  calculateTotal,
} from '@/domain/sample-cart/pricing';
import { FREE_TIER_LIMITS, PAID_TIER_FEE } from '@/domain/sample-cart/types';
import type { CheckoutFormData } from '@/domain/sample-cart/types';
import shippingData from '@/domain/sample-cart/shipping-data.json';

// ---------------------------------------------------------------------------
// Derived data — US states dropdown options
// ---------------------------------------------------------------------------

const US_STATES = shippingData.states.map((s) => ({
  value: s.state,
  label: s.state
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' '),
}));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardStep = 'cart' | 'checkout' | 'summary';

interface SampleCartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_FORM: CheckoutFormData = {
  email: '',
  firstName: '',
  lastName: '',
  jobTitle: '',
  company: '',
  address: '',
  addressExtra: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  projectType: '',
  projectStatus: '',
  budget: '',
  location: '',
  materialQty: '',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

function FormField({ id, label, required, className, children }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

interface SectionHeadingProps {
  children: React.ReactNode;
}

function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Pricing row helpers
// ---------------------------------------------------------------------------

function PricingRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? 'text-muted-foreground' : ''}>{label}</span>
      <span className={muted ? 'text-muted-foreground' : 'font-medium'}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SampleCartSheet({ open, onOpenChange }: SampleCartSheetProps) {
  const t = useTranslations('sampleCart');
  const ft = useTranslations('sampleCart.form');

  const { cart, removeItem, pricingSummary, itemCount } = useSampleCart();

  // Wizard state
  const [step, setStep] = React.useState<WizardStep>('cart');

  // Checkout form state
  const [formData, setFormData] = React.useState<CheckoutFormData>(EMPTY_FORM);
  const [privacy, setPrivacy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [paypalUrl, setPaypalUrl] = React.useState<string | null>(null);

  // Derived: shipping cost changes when state or itemCount changes
  const shippingResult = React.useMemo(() => {
    if (!formData.state) return null;
    return calculateShippingCost(formData.state, itemCount);
  }, [formData.state, itemCount]);

  const shippingCost = shippingResult?.cost ?? null;
  const shippingTime = shippingResult?.time ?? null;

  const total = React.useMemo(() => {
    if (shippingCost === null) return null;
    return calculateTotal(pricingSummary.itemsFee, shippingCost);
  }, [pricingSummary.itemsFee, shippingCost]);

  // Reset wizard when sheet closes
  function handleOpenChange(next: boolean) {
    if (!next) {
      setStep('cart');
      setFormData(EMPTY_FORM);
      setPrivacy(false);
      setFormError(null);
      setSubmitError(null);
      setPaypalUrl(null);
    }
    onOpenChange(next);
  }

  // Form field updater
  function setField(key: keyof CheckoutFormData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // Checkout form submit
  function handleCheckoutSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!privacy) {
      setFormError(ft('privacyError'));
      return;
    }
    setFormError(null);
    setStep('summary');
  }

  // Final PayPal submit (placeholder)
  const handleSubmit = React.useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // TODO: Wire to server action in Phase 4
      console.log('Checkout payload:', {
        items: cart.items.map((i) => ({
          nid: i.nid,
          title: i.title,
          variant: i.variant,
          type: i.type,
        })),
        shipping: formData,
        itemsFee: pricingSummary.itemsFee,
        shippingCost: shippingCost ?? 0,
        total: total ?? pricingSummary.itemsFee,
      });
      // Simulate success for now
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      setPaypalUrl('#paypal-placeholder');
    } catch {
      setSubmitError(t('checkoutError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [cart.items, formData, pricingSummary.itemsFee, shippingCost, total, t]);

  // Samples fee display
  const samplesFeeDisplay =
    pricingSummary.itemsFee === 0
      ? t('freeLabel')
      : t('flatFee', { amount: PAID_TIER_FEE.toFixed(2) });

  // Shipping display in cart step
  const shippingCartDisplay = t('shippingCalculated');

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col overflow-hidden sm:max-w-lg"
      >
        {/* ---------------------------------------------------------------- */}
        {/* Step 1: Cart Review                                               */}
        {/* ---------------------------------------------------------------- */}
        {step === 'cart' && (
          <>
            <SheetHeader>
              <SheetTitle>{t('title')}</SheetTitle>
              <SheetDescription>
                {t('itemCount', { count: itemCount })}
              </SheetDescription>
            </SheetHeader>

            {/* Items list — scrollable */}
            <div className="flex-1 overflow-y-auto px-4">
              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <p className="font-medium">{t('emptyCart')}</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {t('emptyCartCta')}
                  </p>
                </div>
              ) : (
                <ul
                  className="flex flex-col gap-(--spacing-element) py-2"
                  aria-label={t('title')}
                >
                  {cart.items.map((item) => (
                    <li key={item.nid} className="flex items-start gap-3 py-3">
                      {/* Thumbnail */}
                      <div className="size-12 shrink-0 rounded overflow-hidden bg-surface-1 border border-border">
                        {item.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            width={48}
                            height={48}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div
                            className="size-full bg-muted"
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug truncate">
                          {item.title}
                        </p>
                        {item.collection && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.collection}
                          </p>
                        )}
                        {item.variant && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.variant}
                          </p>
                        )}
                      </div>

                      {/* Remove */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${t('remove')} ${item.title}`}
                        onClick={() => removeItem(item.nid)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2Icon />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer: pricing + CTA */}
            <SheetFooter className="border-t border-border pt-4">
              <div className="w-full flex flex-col gap-3">
                {/* Pricing summary */}
                <div className="flex flex-col gap-1.5">
                  <PricingRow
                    label={t('samplesLabel')}
                    value={samplesFeeDisplay}
                  />
                  <PricingRow
                    label={t('shipping')}
                    value={shippingCartDisplay}
                    muted
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  {t('freeSamplesNote', {
                    mosaicLimit: FREE_TIER_LIMITS.mosaico,
                    vetriteLimit: FREE_TIER_LIMITS.vetrite,
                  })}
                </p>

                <Button
                  className="w-full"
                  disabled={cart.items.length === 0}
                  onClick={() => setStep('checkout')}
                >
                  {t('proceedToCheckout')}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Step 2: Checkout Form                                             */}
        {/* ---------------------------------------------------------------- */}
        {step === 'checkout' && (
          <>
            {/* Back button lives above the header so it's always visible */}
            <div className="flex items-center gap-2 px-4 pt-1 pb-0">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('backToCart')}
                onClick={() => setStep('cart')}
              >
                <ArrowLeftIcon />
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('backToCart')}
              </span>
            </div>

            <SheetHeader className="pt-2">
              <SheetTitle>{t('shippingInfo')}</SheetTitle>
            </SheetHeader>

            {/* Scrollable form */}
            <form
              id="sample-cart-checkout"
              onSubmit={handleCheckoutSubmit}
              className="flex-1 overflow-y-auto px-4"
            >
              <div className="grid grid-cols-6 gap-3 pb-4">
                {/* Personal Information */}
                <div className="col-span-6">
                  <SectionHeading>{t('personalInfo')}</SectionHeading>
                </div>

                <FormField
                  id="sc-email"
                  label={ft('email')}
                  required
                  className="col-span-6"
                >
                  <Input
                    id="sc-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setField('email', e.target.value)}
                  />
                </FormField>

                <FormField
                  id="sc-firstName"
                  label={ft('firstName')}
                  required
                  className="col-span-3"
                >
                  <Input
                    id="sc-firstName"
                    name="firstName"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={(e) => setField('firstName', e.target.value)}
                  />
                </FormField>

                <FormField
                  id="sc-lastName"
                  label={ft('lastName')}
                  required
                  className="col-span-3"
                >
                  <Input
                    id="sc-lastName"
                    name="lastName"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={(e) => setField('lastName', e.target.value)}
                  />
                </FormField>

                <FormField
                  id="sc-jobTitle"
                  label={ft('jobTitle')}
                  required
                  className="col-span-3"
                >
                  <Input
                    id="sc-jobTitle"
                    name="jobTitle"
                    autoComplete="organization-title"
                    required
                    value={formData.jobTitle}
                    onChange={(e) => setField('jobTitle', e.target.value)}
                  />
                </FormField>

                <FormField
                  id="sc-company"
                  label={ft('company')}
                  required
                  className="col-span-3"
                >
                  <Input
                    id="sc-company"
                    name="company"
                    autoComplete="organization"
                    required
                    value={formData.company}
                    onChange={(e) => setField('company', e.target.value)}
                  />
                </FormField>

                {/* Shipping Address */}
                <div className="col-span-6 mt-1">
                  <SectionHeading>{t('shippingInfo')}</SectionHeading>
                </div>

                <FormField
                  id="sc-address"
                  label={ft('address')}
                  required
                  className="col-span-6"
                >
                  <Input
                    id="sc-address"
                    name="address"
                    autoComplete="address-line1"
                    required
                    value={formData.address}
                    onChange={(e) => setField('address', e.target.value)}
                  />
                </FormField>

                <FormField
                  id="sc-addressExtra"
                  label={ft('addressExtra')}
                  className="col-span-6"
                >
                  <Input
                    id="sc-addressExtra"
                    name="addressExtra"
                    autoComplete="address-line2"
                    value={formData.addressExtra}
                    onChange={(e) => setField('addressExtra', e.target.value)}
                  />
                </FormField>

                <FormField
                  id="sc-city"
                  label={ft('city')}
                  required
                  className="col-span-6 sm:col-span-3"
                >
                  <Input
                    id="sc-city"
                    name="city"
                    autoComplete="address-level2"
                    required
                    value={formData.city}
                    onChange={(e) => setField('city', e.target.value)}
                  />
                </FormField>

                <FormField
                  id="sc-state"
                  label={ft('state')}
                  required
                  className="col-span-3 sm:col-span-2"
                >
                  <Select
                    value={formData.state}
                    onValueChange={(v) => setField('state', v ?? '')}
                  >
                    <SelectTrigger id="sc-state" className="w-full">
                      <SelectValue placeholder={ft('selectState')} />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  id="sc-zip"
                  label={ft('zip')}
                  required
                  className="col-span-3 sm:col-span-1"
                >
                  <Input
                    id="sc-zip"
                    name="zip"
                    autoComplete="postal-code"
                    required
                    value={formData.zip}
                    onChange={(e) => setField('zip', e.target.value)}
                  />
                </FormField>

                <FormField
                  id="sc-phone"
                  label={ft('phone')}
                  required
                  className="col-span-6"
                >
                  <Input
                    id="sc-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                  />
                </FormField>

                {/* Project Information (optional) */}
                <div className="col-span-6 mt-1">
                  <SectionHeading>{t('projectInfo')}</SectionHeading>
                </div>

                <FormField
                  id="sc-projectType"
                  label={ft('projectType')}
                  className="col-span-6 sm:col-span-3"
                >
                  <Input
                    id="sc-projectType"
                    name="projectType"
                    value={formData.projectType}
                    onChange={(e) => setField('projectType', e.target.value)}
                  />
                </FormField>

                <FormField
                  id="sc-projectStatus"
                  label={ft('projectStatus')}
                  className="col-span-6 sm:col-span-3"
                >
                  <Input
                    id="sc-projectStatus"
                    name="projectStatus"
                    value={formData.projectStatus}
                    onChange={(e) => setField('projectStatus', e.target.value)}
                  />
                </FormField>

                <FormField
                  id="sc-budget"
                  label={ft('budget')}
                  className="col-span-6 sm:col-span-3"
                >
                  <Input
                    id="sc-budget"
                    name="budget"
                    value={formData.budget}
                    onChange={(e) => setField('budget', e.target.value)}
                  />
                </FormField>

                <FormField
                  id="sc-location"
                  label={ft('location')}
                  className="col-span-6 sm:col-span-3"
                >
                  <Input
                    id="sc-location"
                    name="location"
                    value={formData.location}
                    onChange={(e) => setField('location', e.target.value)}
                  />
                </FormField>

                <FormField
                  id="sc-materialQty"
                  label={ft('materialQty')}
                  className="col-span-6"
                >
                  <Input
                    id="sc-materialQty"
                    name="materialQty"
                    value={formData.materialQty}
                    onChange={(e) => setField('materialQty', e.target.value)}
                  />
                </FormField>

                {/* Privacy */}
                <div className="col-span-6 flex items-start gap-2 pt-1">
                  <Checkbox
                    id="sc-privacy"
                    checked={privacy}
                    onCheckedChange={(checked) => setPrivacy(checked === true)}
                  />
                  <Label
                    htmlFor="sc-privacy"
                    className="text-sm leading-snug cursor-pointer font-normal"
                  >
                    {ft('privacy')} *
                  </Label>
                </div>

                {formError && (
                  <p
                    className="col-span-6 text-sm text-destructive"
                    role="alert"
                  >
                    {formError}
                  </p>
                )}
              </div>
            </form>

            {/* Shipping cost preview */}
            <SheetFooter className="border-t border-border pt-4">
              <div className="w-full flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <PricingRow
                    label={t('samplesLabel')}
                    value={
                      pricingSummary.itemsFee === 0
                        ? t('freeLabel')
                        : `$${pricingSummary.itemsFee.toFixed(2)}`
                    }
                  />
                  <PricingRow
                    label={t('shipping')}
                    value={
                      shippingCost !== null
                        ? `$${shippingCost.toFixed(2)}`
                        : t('shippingCalculated')
                    }
                    muted={shippingCost === null}
                  />
                  {shippingTime && (
                    <p className="text-xs text-muted-foreground">
                      {shippingTime}
                    </p>
                  )}
                  {total !== null && (
                    <>
                      <Separator />
                      <PricingRow
                        label={t('total')}
                        value={`$${total.toFixed(2)}`}
                      />
                    </>
                  )}
                </div>

                <Button
                  type="submit"
                  form="sample-cart-checkout"
                  className="w-full"
                >
                  {t('placeOrder')}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Step 3: Summary + PayPal redirect                                 */}
        {/* ---------------------------------------------------------------- */}
        {step === 'summary' && (
          <>
            <SheetHeader>
              <SheetTitle>{t('orderSummary')}</SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* Items summary */}
              <ul
                className="flex flex-col gap-2 py-2"
                aria-label={t('orderSummary')}
              >
                {cart.items.map((item) => (
                  <li key={item.nid} className="flex items-center gap-3">
                    <div className="size-10 shrink-0 rounded overflow-hidden bg-surface-1 border border-border">
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          width={40}
                          height={40}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div
                          className="size-full bg-muted"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.title}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground truncate">
                          {item.variant}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <Separator className="my-3" />

              {/* Shipping address */}
              <div className="text-sm flex flex-col gap-0.5 text-muted-foreground">
                <p className="font-medium text-foreground">
                  {formData.firstName} {formData.lastName}
                </p>
                <p>{formData.address}</p>
                {formData.addressExtra && <p>{formData.addressExtra}</p>}
                <p>
                  {formData.city},{' '}
                  {formData.state
                    .split('_')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}{' '}
                  {formData.zip}
                </p>
                <p>{formData.phone}</p>
              </div>

              <Separator className="my-3" />

              {/* Pricing summary */}
              <div className="flex flex-col gap-1.5">
                <PricingRow
                  label={t('samplesLabel')}
                  value={
                    pricingSummary.itemsFee === 0
                      ? t('freeLabel')
                      : `$${pricingSummary.itemsFee.toFixed(2)}`
                  }
                />
                <PricingRow
                  label={t('shipping')}
                  value={
                    shippingCost !== null
                      ? `$${shippingCost.toFixed(2)}`
                      : t('shippingCalculated')
                  }
                  muted={shippingCost === null}
                />
                {shippingTime && (
                  <p className="text-xs text-muted-foreground">
                    {shippingTime}
                  </p>
                )}
                {total !== null && (
                  <>
                    <Separator />
                    <PricingRow
                      label={t('total')}
                      value={`$${total.toFixed(2)}`}
                    />
                  </>
                )}
              </div>
            </div>

            <SheetFooter className="border-t border-border pt-4">
              <div className="w-full flex flex-col gap-3">
                {submitError && (
                  <p className="text-sm text-destructive" role="alert">
                    {submitError}
                  </p>
                )}

                {paypalUrl ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground text-center">
                      {t('redirecting')}
                    </p>
                    <a
                      href={paypalUrl}
                      className="text-sm text-primary underline text-center"
                    >
                      {t('paypalFallback')}
                    </a>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? t('processing') : t('placeOrder')}
                  </Button>
                )}

                {submitError && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSubmitError(null);
                      handleSubmit();
                    }}
                    disabled={isSubmitting}
                  >
                    {t('placeOrder')}
                  </Button>
                )}
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
