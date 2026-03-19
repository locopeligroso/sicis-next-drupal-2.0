import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item"

const meta = {
  title: "Primitives/Item",
  component: Item,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "muted"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "xs"],
    },
  },
} satisfies Meta<typeof Item>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    variant: "default",
    size: "default",
  },
  render: ({ variant, size }) => (
    <Item variant={variant} size={size}>
      <ItemContent>
        <ItemTitle>Item title</ItemTitle>
        <ItemDescription>This is a description for the item.</ItemDescription>
      </ItemContent>
    </Item>
  ),
}

const variants = ["default", "outline", "muted"] as const
const sizes = ["default", "sm", "xs"] as const

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
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {sizes.map((size) => (
              <div key={size}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    marginBottom: "0.25rem",
                    display: "block",
                  }}
                >
                  size: {size}
                </span>
                <Item variant={variant} size={size}>
                  <ItemContent>
                    <ItemTitle>Item title</ItemTitle>
                    <ItemDescription>
                      Description for {variant} / {size}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
}
