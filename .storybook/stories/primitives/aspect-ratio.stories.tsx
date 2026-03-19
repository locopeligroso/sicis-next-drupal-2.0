import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { AspectRatio } from "@/components/ui/aspect-ratio"

const meta: Meta<typeof AspectRatio> = {
  title: "Primitives/AspectRatio",
  component: AspectRatio,
  args: {
    ratio: 16 / 9,
  },
  argTypes: {
    ratio: {
      control: "select",
      options: [16 / 9, 4 / 3, 1],
      mapping: { "16 / 9": 16 / 9, "4 / 3": 4 / 3, "1": 1 },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AspectRatio>

export const Playground: Story = {
  render: (args) => (
    <AspectRatio {...args}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 8,
          background:
            "linear-gradient(135deg, hsl(220 70% 55%), hsl(280 70% 55%))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        {args.ratio === 1
          ? "1 : 1"
          : args.ratio === 4 / 3
            ? "4 : 3"
            : "16 : 9"}
      </div>
    </AspectRatio>
  ),
}
