"use client"

import { Button } from "@/components/ui/button"
import { PackageIcon, FileTextIcon } from "lucide-react"

interface ProductCtaProps {
  hasSample?: boolean
  onRequestSample?: () => void
  onGetQuote?: () => void
  className?: string
}

export function ProductCta({
  hasSample = true,
  onRequestSample,
  onGetQuote,
  className,
}: ProductCtaProps) {
  return (
    <div className={className}>
      <div className="flex gap-3 md:max-w-sm">
        {hasSample && (
          <Button size="lg" variant="outline" className="flex-1" onClick={onRequestSample}>
            <PackageIcon data-icon="inline-start" />
            Request Sample
          </Button>
        )}
        <Button size="lg" className="flex-1" onClick={onGetQuote}>
          <FileTextIcon data-icon="inline-start" />
          Get a Quote
        </Button>
      </div>
    </div>
  )
}
