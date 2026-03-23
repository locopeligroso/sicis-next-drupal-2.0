import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { FilterGroup } from "@/components/composed/FilterGroup"
import { CheckboxFilter } from "@/components/composed/CheckboxFilter"

const MOCK_OPTIONS = [
  { slug: "waterglass", label: "Waterglass", count: 24 },
  { slug: "glimmer", label: "Glimmer", count: 18 },
  { slug: "iridium", label: "Iridium", count: 12 },
]

const meta = {
  title: "Composed/FilterGroup",
  component: FilterGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof FilterGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    label: "Collection",
  },
  render: (args) => (
    <div className="w-64">
      <FilterGroup {...args}>
        <CheckboxFilter
          options={MOCK_OPTIONS}
          activeValues={[]}
          onChange={() => {}}
        />
      </FilterGroup>
    </div>
  ),
}
