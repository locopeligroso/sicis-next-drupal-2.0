import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { ColorSwatchFilter } from "@/components/composed/ColorSwatchFilter"

const MOCK_OPTIONS = [
  { slug: "bianco", label: "Bianco", cssColor: "#f5f5f0", count: 32 },
  { slug: "nero", label: "Nero", cssColor: "#1a1a1a", count: 18 },
  { slug: "rosso", label: "Rosso", cssColor: "#cc2200", count: 14 },
  { slug: "blu", label: "Blu", cssColor: "#1a5fa8", count: 9 },
  { slug: "verde", label: "Verde", cssColor: "#3a8a3a", count: 7 },
  { slug: "oro", label: "Oro", cssColor: "#c5a55a", count: 5 },
  { slug: "grigio", label: "Grigio", cssColor: "#8a8a8a", count: 0 },
  { slug: "rame", label: "Rame", imageUrl: "https://placehold.co/48x48/b87333/b87333", count: 3 },
]

const meta = {
  title: "Composed/ColorSwatchFilter",
  component: ColorSwatchFilter,
  parameters: { layout: "padded" },
  argTypes: {},
} satisfies Meta<typeof ColorSwatchFilter>

export default meta
type Story = StoryObj<typeof meta>

function ColorSwatchFilterPlayground() {
  const [active, setActive] = useState<string | undefined>("bianco")

  const handleChange = (slug: string) => {
    setActive((prev) => (prev === slug ? undefined : slug))
  }

  return (
    <div className="w-80">
      <ColorSwatchFilter
        options={MOCK_OPTIONS}
        activeValue={active}
        onChange={handleChange}
      />
    </div>
  )
}

export const Playground: Story = {
  render: () => <ColorSwatchFilterPlayground />,
}
