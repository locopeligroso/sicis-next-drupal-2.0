import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { NextIntlClientProvider } from "next-intl"
import { LoadMoreButton } from "@/components/composed/LoadMoreButton"

const MOCK_PRODUCTS = Array.from({ length: 8 }, (_, i) => ({
  id: `product-${i + 1}`,
  type: "prodotto_mosaico",
  title: `Crackle ${["Azure", "Gold", "Pearl", "Ruby", "Emerald", "Onyx", "Amber", "Ivory"][i]}`,
  subtitle: "Waterglass Collection",
  imageUrl: `https://placehold.co/400x400/d4d4d4/666?text=Mosaic+${i + 1}`,
  price: null,
  priceOnDemand: true,
  path: `#product-${i + 1}`,
}))

const MESSAGES = {
  listing: {
    productCount: "{count} products",
    loadMore: "Load {count} more",
    noResults: "No products found",
  },
}

const meta = {
  title: "Composed/LoadMoreButton",
  component: LoadMoreButton,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={MESSAGES}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
  argTypes: {
    pageSize: { control: { type: "number", min: 4, max: 24, step: 4 } },
    productCardRatio: {
      control: "select",
      options: ["1/1", "3/4", "4/3", "16/9"],
    },
  },
} satisfies Meta<typeof LoadMoreButton>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    productType: "prodotto_mosaico",
    activeFilters: [],
    sort: "title:ASC",
    pageSize: 8,
    initialProducts: MOCK_PRODUCTS,
    initialTotal: 32,
    locale: "en",
    productCardRatio: "1/1",
  },
  render: (args) => <LoadMoreButton {...args} />,
}
