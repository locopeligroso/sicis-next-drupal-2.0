'use client';

import * as React from 'react';
import { QuoteFormSheet } from './QuoteFormSheet';

const QuoteContext = React.createContext<{
  openQuote: () => void;
}>({ openQuote: () => {} });

export function useQuoteSheet() {
  return React.useContext(QuoteContext);
}

export function QuoteSheetProvider({
  productName,
  children,
}: {
  productName?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const value = React.useMemo(() => ({ openQuote: () => setOpen(true) }), []);

  return (
    <QuoteContext value={value}>
      {children}
      <QuoteFormSheet open={open} onOpenChange={setOpen} productName={productName} />
    </QuoteContext>
  );
}
