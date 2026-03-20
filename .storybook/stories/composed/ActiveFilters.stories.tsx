import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ActiveFilters } from "@/components/composed/ActiveFilters"

const MOCK_FILTERS = [
  { key: "colore", value: "bianco", label: "Bianco" },
  { key: "colore", value: "nero", label: "Nero" },
  { key: "forma", value: "esagono", label: "Esagono" },
  { key: "finitura", value: "lucido", label: "Lucido" },
  { key: "collezione", value: "waterglass", label: "Waterglass" },
]

const meta = {
  title: "Composed/ActiveFilters",
  component: ActiveFilters,
  parameters: { layout: "padded" },
  argTypes: {},
} satisfies Meta<typeof ActiveFilters>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => (
    <ActiveFilters
      {...args}
      filters={MOCK_FILTERS}
      onRemove={(key, value) => console.log("Remove", key, value)}
      onClearAll={() => console.log("Clear all")}
    />
  ),
}
