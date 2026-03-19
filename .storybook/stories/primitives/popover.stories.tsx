import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

const meta = {
  title: "Primitives/Popover",
  component: Popover,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "6rem 0",
      }}
    >
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>
          Open Popover
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>
              Set the dimensions for the layer.
            </PopoverDescription>
          </PopoverHeader>
          <div
            style={{
              display: "grid",
              gap: "0.5rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span style={{ fontSize: "0.875rem" }}>Width</span>
              <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                100%
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span style={{ fontSize: "0.875rem" }}>Height</span>
              <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                25px
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span style={{ fontSize: "0.875rem" }}>Max Width</span>
              <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                300px
              </span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
}
