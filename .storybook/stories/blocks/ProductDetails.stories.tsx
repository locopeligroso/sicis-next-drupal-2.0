import type { Meta, StoryObj } from "@storybook/react"
import { ProductDetails } from "@/components/blocks/ProductDetails"
import type { AttributeItem } from "@/components/composed/AttributeGrid"

const MOCK_ATTRIBUTES: AttributeItem[] = [
  { label: "Sheet size", value: '11 5/8" x 10 7/8"' },
  { label: "Chip size", value: '6/8" Ø' },
  { label: "Thickness", value: '1/4"' },
  { label: "Shape", value: "Round" },
  { label: "Finishing", value: "Brilliant" },
]

const meta: Meta<typeof ProductDetails> = {
  title: "Blocks/ProductDetails",
  component: ProductDetails,
  parameters: { layout: "fullscreen" },
}
export default meta

type Story = StoryObj<typeof ProductDetails>

export const Playground: Story = {
  render: () => (
    <ProductDetails attributes={MOCK_ATTRIBUTES} />
  ),
}
