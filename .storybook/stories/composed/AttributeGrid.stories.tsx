import type { Meta, StoryObj } from "@storybook/react"
import { AttributeGrid, type AttributeItem } from "@/components/composed/AttributeGrid"

const MOCK_ITEMS: AttributeItem[] = [
  { label: "Sheet size", value: '11 5/8" x 10 7/8"' },
  { label: "Chip size", value: '6/8" Ø' },
  { label: "Thickness", value: '1/4"' },
  { label: "Shape", value: "Round" },
  { label: "Finishing", value: "Brilliant" },
]

const meta: Meta<typeof AttributeGrid> = {
  title: "Composed/AttributeGrid",
  component: AttributeGrid,
  parameters: { layout: "padded" },
}
export default meta

type Story = StoryObj<typeof AttributeGrid>

export const Playground: Story = {
  render: () => <AttributeGrid items={MOCK_ITEMS} />,
}

export const FewItems: Story = {
  render: () => <AttributeGrid items={MOCK_ITEMS.slice(0, 3)} />,
}
