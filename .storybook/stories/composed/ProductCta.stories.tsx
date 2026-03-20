import type { Meta, StoryObj } from "@storybook/react"
import { ProductCta } from "@/components/composed/ProductCta"

const meta: Meta<typeof ProductCta> = {
  title: "Composed/ProductCta",
  component: ProductCta,
  parameters: { layout: "centered" },
}
export default meta

type Story = StoryObj<typeof ProductCta>

export const Playground: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <ProductCta />
    </div>
  ),
}

export const NoSample: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <ProductCta hasSample={false} />
    </div>
  ),
}
