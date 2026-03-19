import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Badge } from "@/components/ui/badge"

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "ghost",
        "link",
      ],
    },
  },
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    variant: "default",
  },
  render: (args) => <Badge {...args}>Badge</Badge>,
}

const variants = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      {variants.map((variant) => (
        <div
          key={variant}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <Badge variant={variant}>{variant}</Badge>
          <span style={{ fontSize: "0.75rem", color: "#888" }}>{variant}</span>
        </div>
      ))}
    </div>
  ),
}
