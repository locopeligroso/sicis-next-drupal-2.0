import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProductCard } from "@/components/composed/ProductCard"

const meta = {
  title: "Composed/ProductCard",
  component: ProductCard,
  parameters: { layout: "centered" },
  argTypes: {
    aspectRatio: {
      control: "select",
      options: ["1/1", "3/4", "4/3", "16/9"],
    },
  },
} satisfies Meta<typeof ProductCard>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    title: "Crackle Azure",
    subtitle: "Waterglass Collection",
    image: { url: "https://placehold.co/400x400/c7d2e3/333?text=Mosaic+Tile", width: null, height: null },
    href: "#",
    aspectRatio: "1/1",
  },
  render: (args) => (
    <div className="w-64">
      <ProductCard {...args} />
    </div>
  ),
}
