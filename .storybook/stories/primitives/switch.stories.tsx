import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Switch } from "@/components/ui/switch"

const meta: Meta<typeof Switch> = {
  title: "Primitives/Switch",
  component: Switch,
  args: {
    disabled: false,
    checked: false,
    size: "default",
  },
  argTypes: {
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
    size: {
      control: "select",
      options: ["sm", "default"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Switch>

export const Playground: Story = {}

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.5rem",
          }}
        >
          Size: default
        </p>
        <Switch size="default" />
      </div>
      <div>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.5rem",
          }}
        >
          Size: sm
        </p>
        <Switch size="sm" />
      </div>
    </div>
  ),
}
