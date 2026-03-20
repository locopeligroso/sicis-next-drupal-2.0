import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CategoryCard } from "@/components/composed/CategoryCard"

const meta = {
  title: "Composed/CategoryCard",
  component: CategoryCard,
  parameters: { layout: "centered" },
  argTypes: {
    aspectRatio: {
      control: "select",
      options: ["1/1", "4/3", "16/9", "3/4"],
    },
    hasColorSwatch: { control: "boolean" },
  },
} satisfies Meta<typeof CategoryCard>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    title: "Waterglass",
    imageUrl: "https://placehold.co/400x400/d4c5a9/333?text=Waterglass",
    href: "#",
    aspectRatio: "1/1",
    hasColorSwatch: false,
  },
  render: (args) => (
    <div className="w-56">
      <CategoryCard {...args} />
    </div>
  ),
}
