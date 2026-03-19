import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Checkbox } from "@/components/ui/checkbox"

const meta: Meta<typeof Checkbox> = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  args: {
    disabled: false,
    checked: false,
  },
  argTypes: {
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
  },
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Playground: Story = {}
