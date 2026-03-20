import type { Meta, StoryObj } from "@storybook/react"
import { ProductSpecs } from "@/components/blocks/ProductSpecs"
import type { SpecsRow } from "@/components/composed/SpecsTable"

const MOCK_SPECS: SpecsRow[] = [
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

const meta: Meta<typeof ProductSpecs> = {
  title: "Blocks/ProductSpecs",
  component: ProductSpecs,
  parameters: { layout: "fullscreen" },
}
export default meta

type Story = StoryObj<typeof ProductSpecs>

export const Playground: Story = {
  render: () => (
    <ProductSpecs
      collectionName="Neocolibrì - barrels"
      specs={MOCK_SPECS}
      assemblyValue="On fiber mesh"
      assemblyImageSrc="/images/Retinatura-mosaico-rete.jpg.webp"
      groutingValue="Bianco Assoluto 100"
      groutingImageSrc="https://placehold.co/120x120/f0f0f0/666?text=Grout"
      groutConsumption="0.00 kg/sqft"
      maintenanceHtml="<p>Regular cleaning with specific detergents for glass surfaces is recommended.</p>"
      maintenanceGuideHref="#"
    />
  ),
}

export const SpecsOnly: Story = {
  render: () => (
    <ProductSpecs specs={MOCK_SPECS} />
  ),
}
