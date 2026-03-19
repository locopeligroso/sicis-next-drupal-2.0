import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Inbox } from "lucide-react"

import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty"

const meta = {
  title: "Primitives/Empty",
  component: EmptyMedia,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "icon"],
    },
  },
} satisfies Meta<typeof EmptyMedia>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    variant: "default",
  },
  render: ({ variant }) => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant={variant}>
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>No results found</EmptyTitle>
        <EmptyDescription>
          Try adjusting your search or filters to find what you are looking for.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
}

const variants = ["default", "icon"] as const

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "2rem" }}>
      {variants.map((variant) => (
        <div key={variant} style={{ flex: 1 }}>
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
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant={variant}>
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                Try adjusting your search or filters to find what you are looking
                for.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ))}
    </div>
  ),
}
