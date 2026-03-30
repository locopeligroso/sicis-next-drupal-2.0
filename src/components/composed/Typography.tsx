import { cn } from '@/lib/utils';

const roleDefaultTag = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  'subtitle-1': 'h5',
  'subtitle-2': 'h6',
  'body-lg': 'p',
  'body-md': 'p',
  'body-sm': 'p',
  lead: 'p',
  overline: 'span',
  blockquote: 'blockquote',
  caption: 'span',
  'inline-code': 'code',
} as const;

export type TextRole = keyof typeof roleDefaultTag;

export const typographyStyles: Record<TextRole, string> = {
  display:
    'font-heading text-[3rem] md:text-[3.75rem] lg:text-[4.5rem] font-bold leading-[1.05] tracking-[-0.025em] text-balance',
  h1: 'font-heading text-[2.25rem] md:text-[2.75rem] lg:text-[3.25rem] font-bold leading-[1.1] tracking-[-0.02em] text-balance',
  h2: 'font-heading text-[1.875rem] md:text-[2.25rem] lg:text-[2.5rem] font-bold leading-[1.15] tracking-[-0.015em] text-balance',
  h3: 'font-heading text-[1.5rem] md:text-[1.75rem] lg:text-[2rem] font-bold leading-[1.2] tracking-[-0.01em] text-balance',
  h4: 'font-heading text-[1.25rem] md:text-[1.375rem] lg:text-[1.5rem] font-bold leading-[1.2] text-balance',
  'subtitle-1':
    'font-heading text-[1.25rem] lg:text-[1.5rem] font-medium leading-[1.3] text-balance',
  'subtitle-2':
    'font-heading text-[1.125rem] lg:text-[1.25rem] font-medium leading-[1.3] text-balance',
  'body-lg': 'font-body text-lg font-normal leading-relaxed text-pretty',
  'body-md': 'font-body text-base font-normal leading-relaxed text-pretty',
  'body-sm': 'font-body text-sm font-normal leading-normal text-pretty',
  lead: 'font-body text-xl font-normal leading-relaxed text-pretty',
  overline:
    'font-body text-xs font-semibold leading-normal uppercase tracking-widest',
  blockquote:
    'font-body text-lg font-normal leading-relaxed italic text-pretty',
  caption: 'font-body text-xs font-normal leading-normal',
  'inline-code': 'font-code text-sm font-normal leading-normal',
};

type TypographyProps = Omit<React.ComponentProps<'p'>, 'children'> & {
  textRole: TextRole;
  as?: React.ElementType;
  children?: React.ReactNode;
};

export function Typography({
  textRole,
  as,
  className,
  children,
  ...props
}: TypographyProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component: any = as ?? roleDefaultTag[textRole];
  return (
    <Component className={cn(typographyStyles[textRole], className)} {...props}>
      {children}
    </Component>
  );
}
