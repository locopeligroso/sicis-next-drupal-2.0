import { getTranslations } from "next-intl/server"

import { ShareButton } from "@/components/composed/ShareButton"
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
    <div className="flex flex-col gap-(--spacing-element) border-b border-border mb-(--spacing-content) pb-(--spacing-element)">
      <Typography textRole="h1" as="h1" className="max-w-[40ch]">
        {title}
      </Typography>

      {description && (
        <Typography
          textRole="body-md"
          className="max-w-prose text-muted-foreground"
        >
          {description}
        </Typography>
      )}

      {(productCount != null || shareUrl) && (
        <div className="flex items-center gap-2">
          {productCount != null && (
            <Typography textRole="caption" className="text-muted-foreground">
              {t("productCount", { count: productCount })}
            </Typography>
          )}
          {shareUrl && <ShareButton />}
        </div>
      )}
    </div>
  )
}
