import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Separator } from "@/components/ui/separator"

const meta: Meta<typeof Separator> = {
  title: "Primitives/Separator",
  component: Separator,
  args: {
    orientation: "horizontal",
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, height: 120, padding: "1rem" }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Separator>

export const Playground: Story = {}

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.75rem",
          }}
        >
          Horizontal
        </p>
        <div>
          <p style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            Content above
          </p>
          <Separator orientation="horizontal" />
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Content below
          </p>
        </div>
      </div>
      <div>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.75rem",
          }}
        >
          Vertical
        </p>
        <div style={{ display: "flex", alignItems: "center", height: 40 }}>
          <span style={{ fontSize: "0.875rem" }}>Left</span>
          <Separator orientation="vertical" style={{ marginInline: "1rem" }} />
          <span style={{ fontSize: "0.875rem" }}>Right</span>
        </div>
      </div>
    </div>
  ),
}
