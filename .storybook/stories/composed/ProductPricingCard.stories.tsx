import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProductPricingCard } from "@/components/composed/ProductPricingCard"

const meta = {
  title: "Composed/ProductPricingCard",
  component: ProductPricingCard,
  parameters: { layout: "centered" },
  argTypes: {
    inStock: { control: "boolean" },
    price: { control: "text" },
  },
} satisfies Meta<typeof ProductPricingCard>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    price: "$155.00",
    inStock: true,
  },
  render: (args) => (
    <div className="max-w-xs">
      <ProductPricingCard
        {...args}
        priceUnit="/sqft"
        shippingWarehouse="North America Warehouse"
        shippingTime="2-3 weeks"
      />
    </div>
  ),
}
