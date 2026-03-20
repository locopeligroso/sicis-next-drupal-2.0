import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { NextIntlClientProvider } from "next-intl"
import { ListingToolbar } from "@/components/composed/ListingToolbar"

const MOCK_SORT_OPTIONS = [
  { labelKey: "sort.name", field: "title", direction: "ASC" as const },
  { labelKey: "sort.collection", field: "field_collezione.name", direction: "ASC" as const },
  { labelKey: "sort.color", field: "field_colore.name", direction: "ASC" as const },
]

const MESSAGES = {
  listing: {
    productCount: "{count} products",
  },
  sort: {
    label: "Sort by",
    name: "Name",
    collection: "Collection",
    color: "Color",
  },
}

const meta = {
  title: "Composed/ListingToolbar",
  component: ListingToolbar,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={MESSAGES}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
  argTypes: {
    totalCount: { control: { type: "number", min: 0, max: 500 } },
    currentSort: {
      control: "select",
      options: ["title:ASC", "field_collezione.name:ASC", "field_colore.name:ASC"],
    },
  },
} satisfies Meta<typeof ListingToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    totalCount: 128,
    currentSort: "title:ASC",
  },
  render: (args) => (
    <ListingToolbar
      {...args}
      sortOptions={MOCK_SORT_OPTIONS}
      onSortChange={(value) => console.log("Sort changed:", value)}
    />
  ),
}
