import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Label } from "@/components/ui/label"

const meta: Meta<typeof Label> = {
  title: "Primitives/Label",
  component: Label,
}

export default meta
type Story = StoryObj<typeof Label>

export const Playground: Story = {
  render: () => <Label>Email address</Label>,
}
