import type { Meta, StoryObj } from "@storybook/react"
import { SwatchList, type SwatchItem } from "@/components/composed/SwatchList"

const MOCK_COLORS: SwatchItem[] = [
  { name: "Bianco", cssColor: "#f5f5f5" },
  { name: "Nero", cssColor: "#1a1a1a" },
  { name: "Rosso", imageSrc: "https://placehold.co/48x48/cc2200/cc2200" },
  { name: "Blu", cssColor: "#1a5fa8" },
  { name: "Verde", cssColor: "#3a8a3a" },
]

const MOCK_GROUTS: SwatchItem[] = [
  { name: "Bianco Assoluto 100", imageSrc: "https://placehold.co/48x48/f0f0f0/f0f0f0" },
  { name: "Grigio Perla 200", imageSrc: "https://placehold.co/48x48/c0c0c0/c0c0c0" },
  { name: "Antracite 300", imageSrc: "https://placehold.co/48x48/4a4a4a/4a4a4a" },
]

const meta: Meta<typeof SwatchList> = {
  title: "Composed/SwatchList",
  component: SwatchList,
  parameters: { layout: "padded" },
}
export default meta

type Story = StoryObj<typeof SwatchList>

export const Colors: Story = {
  render: () => <SwatchList label="Colors" items={MOCK_COLORS} />,
}

export const Grouts: Story = {
  render: () => <SwatchList label="Grout" items={MOCK_GROUTS} />,
}

export const NoLabel: Story = {
  render: () => <SwatchList items={MOCK_COLORS} />,
}
