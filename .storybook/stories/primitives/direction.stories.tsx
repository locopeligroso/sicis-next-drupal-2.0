import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { DirectionProvider } from "@/components/ui/direction"

const meta = {
  title: "Primitives/Direction",
  component: DirectionProvider,
} satisfies Meta<typeof DirectionProvider>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          LTR (Left-to-Right)
        </div>
        <DirectionProvider direction="ltr">
          <div
            style={{
              padding: "1rem",
              border: "1px solid #e5e5e5",
              borderRadius: 8,
            }}
          >
            <p>This text flows from left to right. English, French, German.</p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
              Direction: LTR
            </p>
          </div>
        </DirectionProvider>
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          RTL (Right-to-Left)
        </div>
        <DirectionProvider direction="rtl">
          <div
            dir="rtl"
            style={{
              padding: "1rem",
              border: "1px solid #e5e5e5",
              borderRadius: 8,
            }}
          >
            <p>هذا النص يتدفق من اليمين إلى اليسار. عربي.</p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
              Direction: RTL
            </p>
          </div>
        </DirectionProvider>
      </div>
    </div>
  ),
}
