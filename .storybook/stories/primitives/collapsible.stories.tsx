import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

const meta = {
  title: "Primitives/Collapsible",
  component: Collapsible,
} satisfies Meta<typeof Collapsible>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <Collapsible style={{ maxWidth: 360 }}>
      <CollapsibleTrigger
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "0.5rem 1rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          borderRadius: 6,
          border: "1px solid #e5e5e5",
          background: "transparent",
          cursor: "pointer",
        }}
      >
        Toggle content
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          style={{
            padding: "0.75rem 1rem",
            marginTop: "0.5rem",
            borderRadius: 6,
            border: "1px solid #e5e5e5",
            fontSize: "0.875rem",
          }}
        >
          This is the collapsible content. It can contain any elements you need
          to show or hide.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
}
