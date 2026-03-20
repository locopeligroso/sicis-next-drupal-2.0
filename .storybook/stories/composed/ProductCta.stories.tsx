import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProductCta } from "@/components/composed/ProductCta"

const meta = {
  title: "Composed/ProductCta",
  component: ProductCta,
  parameters: { layout: "centered" },
  argTypes: {
    hasSample: { control: "boolean" },
  },
} satisfies Meta<typeof ProductCta>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    hasSample: true,
  },
  render: (args) => (
    <div className="w-full max-w-sm">
      <ProductCta {...args} />
    </div>
  ),
}
