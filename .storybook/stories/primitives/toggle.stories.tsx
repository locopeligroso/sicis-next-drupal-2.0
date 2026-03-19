import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Bold } from "lucide-react"

import { Toggle } from "@/components/ui/toggle"

const meta = {
  title: "Primitives/Toggle",
  component: Toggle,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
    disabled: {
      control: "boolean",
    },
    pressed: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Toggle>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    variant: "default",
    size: "default",
    disabled: false,
    pressed: false,
  },
  render: (args) => (
    <Toggle {...args}>
      <Bold />
    </Toggle>
  ),
}

const variants = ["default", "outline"] as const
const sizes = ["default", "sm", "lg"] as const

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {variants.map((variant) => (
        <div key={variant}>
          <div
            style={{
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {variant}
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            {sizes.map((size) => (
              <div
                key={size}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <Toggle variant={variant} size={size}>
                  <Bold />
                </Toggle>
                <span style={{ fontSize: "0.75rem", color: "#888" }}>
                  {size}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
}
