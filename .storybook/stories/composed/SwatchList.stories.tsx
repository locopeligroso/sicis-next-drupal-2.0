import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SwatchList, type SwatchItem } from "@/components/composed/SwatchList"

const MOCK_ITEMS: SwatchItem[] = [
  { name: "Bianco", cssColor: "#f5f5f5" },
  { name: "Nero", cssColor: "#1a1a1a" },
  { name: "Rosso", imageSrc: "https://placehold.co/48x48/cc2200/cc2200" },
  { name: "Blu", cssColor: "#1a5fa8" },
  { name: "Verde", cssColor: "#3a8a3a" },
]

const meta = {
  title: "Composed/SwatchList",
  component: SwatchList,
  parameters: { layout: "padded" },
  argTypes: {
    label: { control: "text" },
  },
} satisfies Meta<typeof SwatchList>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    label: "Colors",
  },
  render: (args) => <SwatchList {...args} items={MOCK_ITEMS} />,
}
