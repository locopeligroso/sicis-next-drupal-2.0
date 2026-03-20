import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CategoryCardGrid } from "@/components/composed/CategoryCardGrid"
import type { FilterOption } from "@/domain/filters/registry"

const MOCK_CARDS: FilterOption[] = [
  { slug: "waterglass", label: "Waterglass", imageUrl: "https://placehold.co/400x400/d4c5a9/333?text=Waterglass" },
  { slug: "glimmer", label: "Glimmer", imageUrl: "https://placehold.co/400x400/8ba5b5/333?text=Glimmer" },
  { slug: "iridium", label: "Iridium", imageUrl: "https://placehold.co/400x400/b5a88b/333?text=Iridium" },
  { slug: "diamond", label: "Diamond", imageUrl: "https://placehold.co/400x400/e2ddd5/333?text=Diamond" },
  { slug: "murano", label: "Murano", imageUrl: "https://placehold.co/400x400/7a9e7a/333?text=Murano" },
  { slug: "colorpedia", label: "Colorpedia", imageUrl: "https://placehold.co/400x400/cc8855/333?text=Colorpedia" },
]

const MOCK_COLOR_CARDS: FilterOption[] = [
  { slug: "bianco", label: "Bianco", cssColor: "#f5f5f0" },
  { slug: "nero", label: "Nero", cssColor: "#1a1a1a" },
  { slug: "rosso", label: "Rosso", cssColor: "#cc2200" },
  { slug: "blu", label: "Blu", cssColor: "#1a5fa8" },
  { slug: "verde", label: "Verde", cssColor: "#3a8a3a" },
  { slug: "oro", label: "Oro", cssColor: "#c5a55a" },
]

const meta = {
  title: "Composed/CategoryCardGrid",
  component: CategoryCardGrid,
  parameters: { layout: "padded" },
  argTypes: {
    aspectRatio: {
      control: "select",
      options: ["1/1", "4/3", "16/9", "3/4"],
    },
    hasColorSwatch: { control: "boolean" },
  },
} satisfies Meta<typeof CategoryCardGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    title: "Collections",
    aspectRatio: "1/1",
    hasColorSwatch: false,
  },
  render: (args) => (
    <CategoryCardGrid
      {...args}
      cards={args.hasColorSwatch ? MOCK_COLOR_CARDS : MOCK_CARDS}
      buildHref={(slug) => `#${slug}`}
    />
  ),
}
