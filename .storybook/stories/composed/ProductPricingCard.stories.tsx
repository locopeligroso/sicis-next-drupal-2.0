import type { Meta, StoryObj } from "@storybook/react"
import { ProductPricingCard } from "@/components/composed/ProductPricingCard"

const meta: Meta<typeof ProductPricingCard> = {
  title: "Composed/ProductPricingCard",
  component: ProductPricingCard,
  parameters: { layout: "centered" },
}
export default meta

type Story = StoryObj<typeof ProductPricingCard>

export const InStock: Story = {
  render: () => (
    <div className="max-w-xs">
      <ProductPricingCard
        price="$155.00"
        priceUnit="/sqft"
        inStock
        shippingWarehouse="North America Warehouse"
        shippingTime="2-3 weeks"
      />
    </div>
  ),
}

export const OutOfStockWithPrice: Story = {
  render: () => (
    <div className="max-w-xs">
      <ProductPricingCard
        price="$155.00"
        priceUnit="/sqft"
        inStock={false}
      />
    </div>
  ),
}

export const OutOfStockNoPrice: Story = {
  render: () => (
    <div className="max-w-xs">
      <ProductPricingCard inStock={false} />
    </div>
  ),
}
