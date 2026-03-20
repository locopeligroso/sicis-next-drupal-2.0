import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import type {
  CategoryGroupDef,
  FilterGroupConfig,
  FilterOption,
} from "@/domain/filters/registry"
import { CategoryCardGrid } from "@/components/composed/CategoryCardGrid"

/**
 * SpecCategory is an async server component that calls `getTranslations`
 * from next-intl/server, which cannot run in Storybook. This story renders the
 * inner CategoryCardGrid directly with the same data shapes the block would
 * receive, giving a faithful visual preview of the layout.
 */

const MOCK_COLLECTION_OPTIONS: FilterOption[] = [
  {
    slug: "waterglass",
    label: "Waterglass",
    imageUrl: "https://placehold.co/400x400/e2cda8/333?text=Waterglass",
  },
  {
    slug: "glimmer",
    label: "Glimmer",
    imageUrl: "https://placehold.co/400x400/d4c4b0/333?text=Glimmer",
  },
  {
    slug: "iridium",
    label: "Iridium",
    imageUrl: "https://placehold.co/400x400/b8c6d4/333?text=Iridium",
  },
  {
    slug: "colibri",
    label: "Colibri",
    imageUrl: "https://placehold.co/400x400/c6d4b8/333?text=Colibri",
  },
]

const MOCK_COLOR_OPTIONS: FilterOption[] = [
  { slug: "blue", label: "Blue", cssColor: "#3b82f6" },
  { slug: "gold", label: "Gold", cssColor: "#d4a843" },
  { slug: "green", label: "Green", cssColor: "#22c55e" },
  { slug: "white", label: "White", cssColor: "#f5f5f5" },
  { slug: "black", label: "Black", cssColor: "#1a1a1a" },
  { slug: "red-orange", label: "Red / Orange", cssColor: "#e85d3a" },
]

const MOCK_CATEGORY_GROUPS: CategoryGroupDef[] = [
  {
    filterKey: "collection",
    labelKey: "filters.collections",
    hasImage: true,
    hasColorSwatch: false,
  },
  {
    filterKey: "color",
    labelKey: "filters.colors",
    hasImage: false,
    hasColorSwatch: true,
  },
]

const MOCK_FILTER_OPTIONS: Record<string, FilterOption[]> = {
  collection: MOCK_COLLECTION_OPTIONS,
  color: MOCK_COLOR_OPTIONS,
}

const MOCK_FILTERS: Record<string, FilterGroupConfig> = {
  collection: {
    key: "collection",
    drupalField: "field_collezione.name",
    type: "path",
    pathPrefix: { it: "collezione", en: "collection", fr: "collection" },
    displayAs: "buttons",
    multiSelect: false,
    priority: "P0",
  },
  color: {
    key: "color",
    drupalField: "field_colore.name",
    type: "path",
    pathPrefix: { it: "colore", en: "color", fr: "couleur" },
    displayAs: "buttons",
    multiSelect: false,
    priority: "P0",
  },
}

const meta = {
  title: "Blocks/SpecCategory",
  component: CategoryCardGrid,
  parameters: { layout: "fullscreen" },
  argTypes: {
    aspectRatio: {
      control: "select",
      options: ["1/1", "4/3", "3/2", "16/9"],
    },
    hasColorSwatch: { control: "boolean" },
  },
} satisfies Meta<typeof CategoryCardGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    aspectRatio: "1/1",
  },
  render: (args) => (
    <div className="max-w-7xl mx-auto px-(--spacing-page) py-(--spacing-section)">
      <div className="flex flex-col gap-8">
        {MOCK_CATEGORY_GROUPS.map((group) => {
          const cards = MOCK_FILTER_OPTIONS[group.filterKey] ?? []
          const filterConfig = MOCK_FILTERS[group.filterKey]
          const pathPrefix = filterConfig?.pathPrefix?.["en"]
          const buildHref = pathPrefix
            ? (slug: string) => `/en/mosaico/${pathPrefix}/${slug}`
            : (slug: string) => `/en/mosaico/${slug}`

          return (
            <CategoryCardGrid
              key={group.filterKey}
              title={group.labelKey.replace(/^filters\./, "").replace(/^\w/, (c) => c.toUpperCase())}
              cards={cards}
              aspectRatio={args.aspectRatio ?? "1/1"}
              hasColorSwatch={group.hasColorSwatch}
              buildHref={buildHref}
            />
          )
        })}
      </div>
    </div>
  ),
}
