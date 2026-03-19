import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Input } from "@/components/ui/input"

const meta: Meta<typeof Input> = {
  title: "Primitives/Input",
  component: Input,
  args: {
    type: "text",
    placeholder: "Enter text...",
    disabled: false,
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "password", "email", "number", "search", "tel", "url"],
    },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Playground: Story = {}
