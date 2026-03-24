'use client'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { LinkIcon } from 'lucide-react'

export function ShareButton() {
  const t = useTranslations('share')

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success(t('copied'))
  }

  return (
    <Button variant="outline" size="icon-sm" onClick={handleShare} title={t('copyLink')}>
      <LinkIcon />
    </Button>
  )
}
