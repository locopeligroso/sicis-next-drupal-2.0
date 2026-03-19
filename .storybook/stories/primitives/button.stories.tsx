import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "@/components/ui/button"

const meta = {
  title: "Primitives/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon"],
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    variant: "default",
    size: "default",
    disabled: false,
  },
  render: (args) => <Button {...args}>Button</Button>,
}

const variants = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const

const sizes = ["default", "xs", "sm", "lg", "icon"] as const

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
                <Button variant={variant} size={size}>
                  {size === "icon" ? "+" : "Button"}
                </Button>
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
