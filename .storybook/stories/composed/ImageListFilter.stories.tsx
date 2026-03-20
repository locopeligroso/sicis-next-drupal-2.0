import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ImageListFilter } from "@/components/composed/ImageListFilter"

const MOCK_OPTIONS = [
  {
    slug: "blue",
    label: "Blue",
    imageUrl: "https://placehold.co/64x64/3b82f6/fff?text=B",
    count: 24,
  },
  {
    slug: "gold",
    label: "Gold",
    imageUrl: "https://placehold.co/64x64/eab308/fff?text=G",
    count: 18,
  },
  {
    slug: "white",
    label: "White",
    imageUrl: "https://placehold.co/64x64/f5f5f5/666?text=W",
    count: 12,
  },
  {
    slug: "red",
    label: "Red",
    imageUrl: "https://placehold.co/64x64/ef4444/fff?text=R",
    count: 0,
  },
  {
    slug: "black",
    label: "Black",
    imageUrl: null,
    count: 7,
  },
]

const meta = {
  title: "Composed/ImageListFilter",
  component: ImageListFilter,
  parameters: { layout: "padded" },
  argTypes: {
    activeValue: {
      control: "select",
      options: [undefined, "blue", "gold", "white", "red", "black"],
    },
  },
} satisfies Meta<typeof ImageListFilter>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    activeValue: "blue",
  },
  render: (args) => (
    <div className="max-w-xs">
      <ImageListFilter
        {...args}
        options={MOCK_OPTIONS}
        onChange={(slug) => console.log("Filter changed:", slug)}
      />
    </div>
  ),
}
