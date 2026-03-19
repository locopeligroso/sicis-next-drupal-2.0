import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Spinner } from "@/components/ui/spinner"

const meta: Meta<typeof Spinner> = {
  title: "Primitives/Spinner",
  component: Spinner,
}

export default meta
type Story = StoryObj<typeof Spinner>

export const Playground: Story = {}
