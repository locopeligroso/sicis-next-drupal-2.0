import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
  Typography,
  typographyStyles,
  type TextRole,
} from "@/components/composed/typography"

const roleDefaultTag: Record<TextRole, string> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  "subtitle-1": "h5",
  "subtitle-2": "h6",
  "body-lg": "p",
  "body-md": "p",
  "body-sm": "p",
  lead: "p",
  overline: "span",
  blockquote: "blockquote",
  caption: "span",
  "inline-code": "code",
}

const allRoles = Object.keys(typographyStyles) as TextRole[]

const shortTextRoles: TextRole[] = [
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "overline",
  "caption",
]

function getSampleText(role: TextRole): string {
  if (shortTextRoles.includes(role)) {
    return role
  }
  return "The quick brown fox jumps over the lazy dog"
}

function TypographyCatalog() {
  return (
    <div className="flex flex-col gap-0 p-6">
      <h1 className="mb-2 text-2xl font-bold">Typography Tokens</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        All typographic roles rendered with their default HTML tags and
        associated Tailwind classes.
      </p>
      {allRoles.map((role, index) => (
        <div key={role}>
          <div className="flex flex-col gap-2 py-6">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {role}
              </span>
              <span className="text-xs text-muted-foreground/60">
                {"<"}
                {roleDefaultTag[role]}
                {">"}
              </span>
            </div>
            <Typography textRole={role}>{getSampleText(role)}</Typography>
          </div>
          {index < allRoles.length - 1 && (
            <hr className="border-border" />
          )}
        </div>
      ))}
    </div>
  )
}

const meta: Meta = {
  title: "Design Tokens/Typography",
  parameters: {
    layout: "fullscreen",
  },
}

export default meta

type Story = StoryObj

export const Catalog: Story = {
  render: () => <TypographyCatalog />,
}

export const Playground: Story = {
  args: {
    textRole: "body-md" as TextRole,
  },
  argTypes: {
    textRole: {
      control: "select",
      options: allRoles,
      description: "The typographic role to apply",
    },
  },
  render: (args) => (
    <div className="p-6">
      <Typography textRole={args.textRole as TextRole}>
        The quick brown fox jumps over the lazy dog
      </Typography>
    </div>
  ),
}
