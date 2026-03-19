import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Slider } from "@/components/ui/slider"

const meta: Meta<typeof Slider> = {
  title: "Primitives/Slider",
  component: Slider,
  args: {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    defaultValue: [25, 75],
  },
  argTypes: {
    min: { control: { type: "number" } },
    max: { control: { type: "number" } },
    step: { control: { type: "number", min: 1 } },
    disabled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: "1rem" }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Slider>

export const Playground: Story = {}
