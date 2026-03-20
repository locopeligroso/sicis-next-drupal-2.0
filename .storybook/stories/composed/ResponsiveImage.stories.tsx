import type { Meta, StoryObj } from "@storybook/react"
import { ResponsiveImage } from "@/components/composed/ResponsiveImage"

const meta: Meta<typeof ResponsiveImage> = {
  title: "Composed/ResponsiveImage",
  component: ResponsiveImage,
  parameters: {
    layout: "centered",
  },
}
export default meta

type Story = StoryObj<typeof ResponsiveImage>

export const Playground: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <ResponsiveImage
        src="https://placehold.co/800x600/e2e2e2/666?text=Product"
        alt="Product image"
        ratio={4 / 3}
      />
    </div>
  ),
}

export const Square: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <ResponsiveImage
        src="https://placehold.co/600x600/d4d4d4/666?text=Square"
        alt="Square image"
        ratio={1}
      />
    </div>
  ),
}

export const Wide: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <ResponsiveImage
        src="https://placehold.co/800x450/c6c6c6/666?text=Wide"
        alt="Wide image"
        ratio={16 / 9}
      />
    </div>
  ),
}
