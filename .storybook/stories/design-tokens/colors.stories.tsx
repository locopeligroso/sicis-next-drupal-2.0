import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const colorGroups = {
  Core: [
    { token: "--background", tw: "bg-background", fg: null },
    { token: "--foreground", tw: "bg-foreground", fg: null },
    { token: "--border", tw: "bg-border", fg: null },
    { token: "--input", tw: "bg-input", fg: null },
    { token: "--ring", tw: "bg-ring", fg: null },
  ],
  Semantic: [
    { token: "--primary", tw: "bg-primary", fg: "text-primary-foreground" },
    {
      token: "--secondary",
      tw: "bg-secondary",
      fg: "text-secondary-foreground",
    },
    { token: "--muted", tw: "bg-muted", fg: "text-muted-foreground" },
    { token: "--accent", tw: "bg-accent", fg: "text-accent-foreground" },
    { token: "--destructive", tw: "bg-destructive", fg: null },
  ],
  "Card & Popover": [
    { token: "--card", tw: "bg-card", fg: "text-card-foreground" },
    { token: "--popover", tw: "bg-popover", fg: "text-popover-foreground" },
  ],
  Chart: [
    { token: "--chart-1", tw: "bg-chart-1", fg: null },
    { token: "--chart-2", tw: "bg-chart-2", fg: null },
    { token: "--chart-3", tw: "bg-chart-3", fg: null },
    { token: "--chart-4", tw: "bg-chart-4", fg: null },
    { token: "--chart-5", tw: "bg-chart-5", fg: null },
  ],
  Sidebar: [
    { token: "--sidebar", tw: "bg-sidebar", fg: "text-sidebar-foreground" },
    {
      token: "--sidebar-primary",
      tw: "bg-sidebar-primary",
      fg: "text-sidebar-primary-foreground",
    },
    {
      token: "--sidebar-accent",
      tw: "bg-sidebar-accent",
      fg: "text-sidebar-accent-foreground",
    },
    { token: "--sidebar-border", tw: "bg-sidebar-border", fg: null },
    { token: "--sidebar-ring", tw: "bg-sidebar-ring", fg: null },
  ],
} as const

function ColorSwatch({
  token,
  tw,
  fg,
}: {
  token: string
  tw: string
  fg: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`${tw} flex h-16 w-16 items-center justify-center rounded-lg border border-border`}
      >
        {fg && <span className={`${fg} text-sm font-semibold`}>Aa</span>}
      </div>
      <span className="text-xs text-muted-foreground text-center max-w-20 break-all">
        {token}
      </span>
    </div>
  )
}

function ColorCatalog() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <h1 className="text-2xl font-bold">Color Tokens</h1>
      {Object.entries(colorGroups).map(([group, tokens]) => (
        <section key={group}>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {group}
          </h2>
          <div className="flex flex-wrap gap-6">
            {tokens.map((color) => (
              <ColorSwatch
                key={color.token}
                token={color.token}
                tw={color.tw}
                fg={color.fg}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const meta: Meta = {
  title: "Design Tokens/Colors",
  parameters: {
    layout: "fullscreen",
  },
}

export default meta

type Story = StoryObj

export const Catalog: Story = {
  render: () => <ColorCatalog />,
}
