import { getTranslations } from "next-intl/server"

import { Typography } from "@/components/composed/Typography"

interface AiryHeaderProps {
  title: string
  description?: string | null
  productCount?: number
  shareUrl?: string
}

export async function AiryHeader({
  title,
  description,
  productCount,
  shareUrl,
}: AiryHeaderProps) {
  const t = await getTranslations("listing")

  return (
    <div className="mb-6 border-b border-border pb-5">
      <Typography textRole="h1" as="h1">
        {title}
      </Typography>

      {description && (
        <Typography
          textRole="body-md"
          className="mt-3 max-w-[600px] text-muted-foreground"
        >
          {description}
        </Typography>
      )}

      {(productCount != null || shareUrl) && (
        <div className="mt-4 flex items-center gap-2">
          {productCount != null && (
            <Typography textRole="caption" className="text-muted-foreground">
              {t("productCount", { count: productCount })}
            </Typography>
          )}
          {shareUrl && (
            <>
              {productCount != null && (
                <span className="text-muted-foreground">·</span>
              )}
              <span>🔗</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
