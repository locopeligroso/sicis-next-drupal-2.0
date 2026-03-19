import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const spacingTokens = [
  {
    token: "--spacing-page",
    cssVar: "var(--spacing-page)",
    responsive: ["1.5rem", "1.75rem", "2rem"],
  },
  {
    token: "--spacing-section",
    cssVar: "var(--spacing-section)",
    responsive: ["3rem", "4rem", "5rem"],
  },
  {
    token: "--spacing-section-lg",
    cssVar: "var(--spacing-section-lg)",
    responsive: ["4rem", "5rem", "6rem"],
  },
  {
    token: "--spacing-content",
    cssVar: "var(--spacing-content)",
    responsive: ["1.5rem", "2rem", "2.5rem"],
  },
  {
    token: "--spacing-element",
    cssVar: "var(--spacing-element)",
    responsive: ["1rem", "1.25rem", "1.5rem"],
  },
] as const

function SpacingBar({
  token,
  cssVar,
  responsive,
}: {
  token: string
  cssVar: string
  responsive: readonly [string, string, string]
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div
          className="h-8 rounded bg-primary"
          style={{ width: cssVar }}
        />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-foreground">{token}</span>
        <span className="text-xs text-muted-foreground">
          {responsive[0]} / {responsive[1]} / {responsive[2]}{" "}
          <span className="text-muted-foreground/60">(base / md / lg)</span>
        </span>
      </div>
    </div>
  )
}

function SpacingCatalog() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <h1 className="text-2xl font-bold">Spacing Tokens</h1>
      <p className="text-sm text-muted-foreground">
        Responsive spacing tokens scale across breakpoints. Bar widths reflect
        the current breakpoint value.
      </p>
      <div className="flex flex-col gap-6">
        {spacingTokens.map((spacing) => (
          <SpacingBar
            key={spacing.token}
            token={spacing.token}
            cssVar={spacing.cssVar}
            responsive={spacing.responsive}
          />
        ))}
      </div>
    </div>
  )
}

const meta: Meta = {
  title: "Design Tokens/Spacing",
  parameters: {
    layout: "fullscreen",
  },
}

export default meta

type Story = StoryObj

export const Catalog: Story = {
  render: () => <SpacingCatalog />,
}
