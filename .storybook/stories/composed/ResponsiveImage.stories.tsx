import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ResponsiveImage } from "@/components/composed/ResponsiveImage"

const meta = {
  title: "Composed/ResponsiveImage",
  component: ResponsiveImage,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    ratio: { control: "number" },
  },
} satisfies Meta<typeof ResponsiveImage>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    ratio: 4 / 3,
  },
  render: (args) => (
    <div className="w-full max-w-sm">
      <ResponsiveImage
        {...args}
        src="https://placehold.co/800x600/e2e2e2/666?text=Product"
        alt="Product image"
      />
    </div>
  ),
}
