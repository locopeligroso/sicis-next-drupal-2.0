import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Bold, Italic, Underline } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const meta = {
  title: "Primitives/ToggleGroup",
  component: ToggleGroup,
  argTypes: {
    toggleMultiple: {
      control: "boolean",
      name: "toggleMultiple",
    },
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
  },
} satisfies Meta<typeof ToggleGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    toggleMultiple: false,
    variant: "default",
    size: "default",
  },
  render: ({ toggleMultiple, variant, size }) => (
    <ToggleGroup toggleMultiple={toggleMultiple} variant={variant} size={size}>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

const variants = ["default", "outline"] as const
const sizes = ["sm", "default", "lg"] as const

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
            style={{ display: "flex", alignItems: "center", gap: "1rem" }}
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
                <ToggleGroup variant={variant} size={size}>
                  <ToggleGroupItem value="bold" aria-label="Toggle bold">
                    <Bold />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="italic" aria-label="Toggle italic">
                    <Italic />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="underline"
                    aria-label="Toggle underline"
                  >
                    <Underline />
                  </ToggleGroupItem>
                </ToggleGroup>
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
