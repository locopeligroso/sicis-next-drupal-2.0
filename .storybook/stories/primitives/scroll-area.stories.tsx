import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const meta: Meta<typeof ScrollArea> = {
  title: "Primitives/ScrollArea",
  component: ScrollArea,
}

export default meta
type Story = StoryObj<typeof ScrollArea>

const tags = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`)

export const Playground: Story = {
  render: () => (
    <ScrollArea style={{ height: 280, width: 240, borderRadius: 8, border: "1px solid hsl(var(--border))" }}>
      <div style={{ padding: "1rem" }}>
        <h4
          style={{
            marginBottom: "1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          Scrollable list
        </h4>
        {tags.map((tag) => (
          <div
            key={tag}
            style={{
              fontSize: "0.875rem",
              paddingBlock: "0.375rem",
              borderBottom: "1px solid hsl(var(--border))",
            }}
          >
            {tag}
          </div>
        ))}
      </div>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  ),
}
