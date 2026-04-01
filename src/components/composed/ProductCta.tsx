'use client';

import { Button } from '@/components/ui/button';
import { PackageIcon, FileTextIcon } from 'lucide-react';
import { useQuoteSheet } from '@/components/composed/QuoteSheetProvider';

interface ProductCtaProps {
    hasSample?: boolean;
    showRequestSample?: boolean;
    onRequestSample?: () => void;
    onGetQuote?: () => void;
    className?: string;
}

export function ProductCta({
    hasSample = true,
    showRequestSample = true,
    onRequestSample,
    onGetQuote,
    className,
}: ProductCtaProps) {
    const { openQuote } = useQuoteSheet();
    const handleGetQuote = onGetQuote ?? openQuote;
    return (
        <div className={className}>
            <div className="flex gap-3 md:max-w-sm">
                {hasSample && showRequestSample && (
                    <Button
                        size="lg"
                        variant="outline"
                        className="flex-1"
                        onClick={onRequestSample}
                    >
                        <PackageIcon data-icon="inline-start" />
                        Request Sample
                    </Button>
                )}
                <Button size="lg" className="flex-1" onClick={handleGetQuote}>
                    <FileTextIcon data-icon="inline-start" />
                    Get a Quote
                </Button>
            </div>
        </div>
    );
}
