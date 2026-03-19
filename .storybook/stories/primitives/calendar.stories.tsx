import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Calendar } from "@/components/ui/calendar"

const meta = {
  title: "Primitives/Calendar",
  component: Calendar,
  argTypes: {
    mode: {
      control: "select",
      options: ["single", "multiple", "range"],
    },
  },
} satisfies Meta<typeof Calendar>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    mode: "single",
  },
  render: ({ mode }) => (
    <div style={{ display: "inline-block" }}>
      <Calendar mode={mode} />
    </div>
  ),
}
