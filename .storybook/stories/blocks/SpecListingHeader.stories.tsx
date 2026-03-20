import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SpecListingHeader } from "@/components/blocks/SpecListingHeader"

const meta = {
  title: "Blocks/SpecListingHeader",
  component: SpecListingHeader,
  parameters: { layout: "fullscreen" },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
  },
} satisfies Meta<typeof SpecListingHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    title: "Mosaic Collection",
    description:
      "Discover the timeless elegance of Sicis mosaic tiles, handcrafted with the finest materials for luxury interiors and exteriors.",
  },
  render: (args) => <SpecListingHeader {...args} />,
}
