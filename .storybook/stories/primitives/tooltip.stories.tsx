import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const meta = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
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
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" />}>
          Hover me
        </TooltipTrigger>
        <TooltipContent>
          This is a tooltip
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}
