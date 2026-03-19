import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Textarea } from "@/components/ui/textarea"

const meta: Meta<typeof Textarea> = {
  title: "Primitives/Textarea",
  component: Textarea,
  args: {
    placeholder: "Type your message here...",
    disabled: false,
    rows: 4,
  },
  argTypes: {
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    rows: { control: { type: "number", min: 1, max: 20 } },
  },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Playground: Story = {}
