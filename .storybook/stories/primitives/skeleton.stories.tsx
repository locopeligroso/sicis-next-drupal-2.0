import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Skeleton } from "@/components/ui/skeleton"

const meta: Meta<typeof Skeleton> = {
  title: "Primitives/Skeleton",
  component: Skeleton,
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const Playground: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Skeleton style={{ height: 16, width: 200 }} />
    </div>
  ),
}

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Text lines */}
      <div>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.75rem",
          }}
        >
          Text lines
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Skeleton style={{ height: 14, width: "100%", maxWidth: 320 }} />
          <Skeleton style={{ height: 14, width: "80%", maxWidth: 256 }} />
          <Skeleton style={{ height: 14, width: "60%", maxWidth: 192 }} />
        </div>
      </div>

      {/* Avatar circle */}
      <div>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.75rem",
          }}
        >
          Avatar circle
        </p>
        <Skeleton
          style={{ height: 48, width: 48, borderRadius: "9999px" }}
        />
      </div>

      {/* Card */}
      <div>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.75rem",
          }}
        >
          Card
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            width: 280,
          }}
        >
          <Skeleton style={{ height: 160, width: "100%", borderRadius: 8 }} />
          <Skeleton style={{ height: 14, width: "70%" }} />
          <Skeleton style={{ height: 14, width: "50%" }} />
        </div>
      </div>
    </div>
  ),
}
