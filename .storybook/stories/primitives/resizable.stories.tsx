import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

const meta = {
  title: "Primitives/Resizable",
  component: ResizablePanelGroup,
} satisfies Meta<typeof ResizablePanelGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <ResizablePanelGroup
      direction="horizontal"
      style={{ minHeight: 200, maxWidth: 600, borderRadius: 8, border: "1px solid #e5e5e5" }}
    >
      <ResizablePanel defaultSize={50}>
        <div
          style={{
            display: "flex",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <span style={{ fontWeight: 500 }}>Panel One</span>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50}>
        <div
          style={{
            display: "flex",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <span style={{ fontWeight: 500 }}>Panel Two</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}
