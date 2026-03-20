import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { NextIntlClientProvider } from "next-intl"
import { SpecFilterSidebarContent } from "@/components/blocks/SpecFilterSidebarContent"
import type {
  FilterGroupConfig,
  FilterOption,
  ActiveFilter,
  ListingConfig,
} from "@/domain/filters/registry"

const MOCK_FILTERS: Record<string, FilterGroupConfig> = {
  collection: {
    key: "collection",
    drupalField: "field_collezione.name",
    type: "path",
    pathPrefix: { en: "collection", it: "collezione" },
    displayAs: "buttons",
    multiSelect: false,
    priority: "P0",
  },
  color: {
    key: "color",
    drupalField: "field_colore.name",
    type: "path",
    pathPrefix: { en: "color", it: "colore" },
    displayAs: "buttons",
    multiSelect: false,
    priority: "P0",
  },
  shape: {
    key: "shape",
    drupalField: "field_forma.name",
    type: "query",
    queryKey: "shape",
    displayAs: "checkboxes",
    multiSelect: true,
    priority: "P1",
  },
  finishing: {
    key: "finishing",
    drupalField: "field_finitura.name",
    type: "query",
    queryKey: "finishing",
    displayAs: "checkboxes",
    multiSelect: true,
    priority: "P2",
  },
}

const MOCK_FILTER_OPTIONS: Record<string, FilterOption[]> = {
  collection: [
    { slug: "waterglass", label: "Waterglass", imageUrl: "https://placehold.co/80x80/e2cda8/333?text=W" },
    { slug: "glimmer", label: "Glimmer", imageUrl: "https://placehold.co/80x80/d4c4b0/333?text=G" },
    { slug: "iridium", label: "Iridium", imageUrl: "https://placehold.co/80x80/b8c6d4/333?text=I" },
    { slug: "colibri", label: "Colibri", imageUrl: "https://placehold.co/80x80/c6d4b8/333?text=C" },
  ],
  color: [
    { slug: "blue", label: "Blue", cssColor: "#3b82f6" },
    { slug: "gold", label: "Gold", cssColor: "#d4a843" },
    { slug: "green", label: "Green", cssColor: "#22c55e" },
    { slug: "white", label: "White", cssColor: "#f5f5f5" },
    { slug: "black", label: "Black", cssColor: "#1a1a1a" },
  ],
  shape: [
    { slug: "round", label: "Round", count: 42 },
    { slug: "square", label: "Square", count: 38 },
    { slug: "hexagonal", label: "Hexagonal", count: 15 },
    { slug: "diamond", label: "Diamond", count: 7 },
  ],
  finishing: [
    { slug: "brilliant", label: "Brilliant", count: 56 },
    { slug: "satin", label: "Satin", count: 34 },
    { slug: "matte", label: "Matte", count: 12 },
  ],
}

const MOCK_ACTIVE_FILTERS: ActiveFilter[] = [
  { key: "collection", value: "waterglass", label: "Waterglass", type: "path" },
]

const MOCK_LISTING_CONFIG: ListingConfig = {
  categoryCardRatio: "1/1",
  productCardRatio: "1/1",
  categoryGroups: [
    { filterKey: "collection", labelKey: "filters.collections", hasImage: true, hasColorSwatch: false },
    { filterKey: "color", labelKey: "filters.colors", hasImage: false, hasColorSwatch: true },
  ],
  sortOptions: [
    { labelKey: "sort.name", field: "title", direction: "ASC" },
  ],
  pageSize: 24,
}

const MESSAGES = {
  filters: {
    title: "Filters",
    activeCount: "{count} active",
    showResults: "Show {count} results",
    additionalFilters: "Additional filters",
    collection: "Collection",
    color: "Color",
    shape: "Shape",
    finishing: "Finishing",
  },
}

const meta = {
  title: "Blocks/SpecFilterSidebarContent",
  component: SpecFilterSidebarContent,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={MESSAGES}>
        <div className="w-64">
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
  argTypes: {
    hasActiveP0: { control: "boolean" },
  },
} satisfies Meta<typeof SpecFilterSidebarContent>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    hasActiveP0: true,
  },
  render: (args) => (
    <SpecFilterSidebarContent
      {...args}
      filters={MOCK_FILTERS}
      filterOptions={MOCK_FILTER_OPTIONS}
      activeFilters={MOCK_ACTIVE_FILTERS}
      listingConfig={MOCK_LISTING_CONFIG}
      basePath="/en/mosaico"
      locale="en"
    />
  ),
}
