import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SpecProductDetails } from "@/components/blocks/SpecProductDetails"
import type { AttributeItem } from "@/components/composed/AttributeGrid"

const MOCK_ATTRIBUTES: AttributeItem[] = [
  { label: "Sheet size", value: '11 5/8" x 10 7/8"' },
  { label: "Chip size", value: '6/8" O' },
  { label: "Thickness", value: '1/4"' },
  { label: "Shape", value: "Round" },
  { label: "Finishing", value: "Brilliant" },
]

const meta = {
  title: "Blocks/SpecProductDetails",
  component: SpecProductDetails,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SpecProductDetails>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => (
    <SpecProductDetails {...args} attributes={MOCK_ATTRIBUTES} />
  ),
}
