import { ArrowRightIcon } from 'lucide-react';
import { Typography } from '@/components/composed/Typography';
import { cn } from '@/lib/utils';
import type { TextRole } from '@/components/composed/Typography';

interface ArrowLinkProps {
  href: string;
  label: string;
  external?: boolean;
  textRole?: TextRole;
  className?: string;
}

export function ArrowLink({
  href,
  label,
  external = false,
  textRole = 'body-md',
  className,
}: ArrowLinkProps) {
  const words = label.split(' ');
  const lastWord = words.pop();
  const rest = words.join(' ');

  return (
    <a
      href={href}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      className={cn(
        'group text-primary hover:underline underline-offset-(--underline-offset)',
        className,
      )}
    >
      <Typography textRole={textRole} as="span">
        {rest}{rest && ' '}
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          {lastWord}
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Typography>
    </a>
  );
}
