import type { Meta, StoryObj } from "@storybook/react"
import { SpecsTable, type SpecsRow } from "@/components/composed/SpecsTable"

const MOCK_ROWS: SpecsRow[] = [
  { label: "Lead content", value: "Absent" },
  { label: "Water absorption (EN 99)", value: "0.06 / 0.18" },
  { label: "Light fastness (DIN 51094)", value: "Resistant" },
  { label: "Chemical resistance (UNI EN ISO 10545-13)", value: "Resistant" },
  { label: "Linear thermal expansion (EN 103)", value: "10.3 - 10.5" },
  { label: "Resistance to heat fluctuations (UNI EN ISO 10545-9)", value: "Resistant" },
  { label: "Ice resistance (ISO 10545-12)", value: "Resistant" },
  { label: "Surface abrasion resistance (ISO 10545-7)", value: "PEI V" },
  { label: "Deep abrasion resistance (EN 102)", value: "331" },
  { label: "Stain resistance (UNI EN ISO 10545-14)", value: "Resistant" },
  { label: "Slip resistance (DIN51097)", value: "Resistant" },
]

const meta: Meta<typeof SpecsTable> = {
  title: "Composed/SpecsTable",
  component: SpecsTable,
  parameters: { layout: "padded" },
}
export default meta

type Story = StoryObj<typeof SpecsTable>

export const Playground: Story = {
  render: () => <SpecsTable rows={MOCK_ROWS} />,
}

export const FewRows: Story = {
  render: () => <SpecsTable rows={MOCK_ROWS.slice(0, 4)} />,
}
