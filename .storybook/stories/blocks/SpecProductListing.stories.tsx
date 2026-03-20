import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { NextIntlClientProvider } from "next-intl"
import { SpecProductListing } from "@/components/blocks/SpecProductListing"
import type { ProductCard } from "@/lib/drupal/products"
import type { SortOptionDef } from "@/domain/filters/registry"

const MOCK_PRODUCTS: ProductCard[] = Array.from({ length: 12 }, (_, i) => ({
  id: `product-${i + 1}`,
  type: "node--prodotto_mosaico",
  title: [
    "Waterglass Azzurro",
    "Iridium Oro",
    "Glimmer Perla",
    "Colibri Rubino",
    "Murano Smalto Blu",
    "Waterglass Smeraldo",
    "Iridium Argento",
    "Glimmer Ambra",
    "Colibri Zaffiro",
    "Murano Smalto Rosso",
    "Waterglass Bianco",
    "Iridium Bronzo",
  ][i],
  subtitle: [
    "Waterglass",
    "Iridium",
    "Glimmer",
    "Colibri",
    "Murano Smalto",
    "Waterglass",
    "Iridium",
    "Glimmer",
    "Colibri",
    "Murano Smalto",
    "Waterglass",
    "Iridium",
  ][i],
  imageUrl: `https://placehold.co/400x400/${
    ["e2cda8", "d4c4b0", "b8c6d4", "c6d4b8", "aab8c6", "c6b8aa", "d4d4d4", "e8d8c8", "b8d4c6", "d4b8b8", "f0f0f0", "c8c0b0"][i]
  }/333?text=${encodeURIComponent(
    ["Azzurro", "Oro", "Perla", "Rubino", "Blu", "Smeraldo", "Argento", "Ambra", "Zaffiro", "Rosso", "Bianco", "Bronzo"][i]
  )}`,
  price: i % 3 === 0 ? `$${(120 + i * 15).toFixed(2)}` : null,
  priceOnDemand: i % 3 !== 0,
  path: `/en/mosaico/product-${i + 1}`,
}))

const MOCK_SORT_OPTIONS: SortOptionDef[] = [
  { labelKey: "sort.name", field: "title", direction: "ASC" },
  { labelKey: "sort.collection", field: "field_collezione.name", direction: "ASC" },
  { labelKey: "sort.color", field: "field_colore.name", direction: "ASC" },
]

const MESSAGES = {
  listing: {
    productCount: "{count} products",
    loadMore: "Load {count} more",
    noResults: "No products found.",
  },
  sort: {
    label: "Sort by",
    name: "Name",
    collection: "Collection",
    color: "Color",
  },
}

const meta = {
  title: "Blocks/SpecProductListing",
  component: SpecProductListing,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={MESSAGES}>
        <div className="max-w-7xl mx-auto px-(--spacing-page) py-(--spacing-section)">
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
  argTypes: {
    total: { control: { type: "number", min: 0, max: 500 } },
    currentSort: {
      control: "select",
      options: ["title:ASC", "field_collezione.name:ASC", "field_colore.name:ASC"],
    },
    pageSize: { control: { type: "number", min: 6, max: 48, step: 6 } },
    productCardRatio: {
      control: "select",
      options: ["1/1", "4/3", "3/2"],
    },
  },
} satisfies Meta<typeof SpecProductListing>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    total: 128,
    currentSort: "title:ASC",
    pageSize: 24,
    productCardRatio: "1/1",
  },
  render: (args) => (
    <SpecProductListing
      {...args}
      products={MOCK_PRODUCTS}
      sortOptions={MOCK_SORT_OPTIONS}
      productType="prodotto_mosaico"
      activeFilters={[]}
      locale="en"
      basePath="/en/mosaico"
    />
  ),
}
