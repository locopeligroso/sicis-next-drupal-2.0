import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { AttributeGrid, type AttributeItem } from "@/components/composed/AttributeGrid"

const MOCK_ITEMS: AttributeItem[] = [
  { label: "Sheet size", value: '11 5/8" x 10 7/8"' },
  { label: "Chip size", value: '6/8" \u00D8' },
  { label: "Thickness", value: '1/4"' },
  { label: "Shape", value: "Round" },
  { label: "Finishing", value: "Brilliant" },
]

const meta = {
  title: "Composed/AttributeGrid",
  component: AttributeGrid,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AttributeGrid>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => <AttributeGrid {...args} items={MOCK_ITEMS} />,
}
