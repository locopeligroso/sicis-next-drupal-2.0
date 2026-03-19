import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress"

const meta: Meta<typeof Progress> = {
  title: "Primitives/Progress",
  component: Progress,
  args: {
    value: 45,
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Progress>

export const Playground: Story = {
  render: (args) => (
    <Progress value={args.value}>
      <ProgressLabel>Uploading...</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
}
