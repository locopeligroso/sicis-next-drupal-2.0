import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { CheckboxFilter } from "@/components/composed/CheckboxFilter"

const MOCK_OPTIONS = [
  { slug: "waterglass", label: "Waterglass", count: 24 },
  { slug: "glimmer", label: "Glimmer", count: 18 },
  { slug: "iridium", label: "Iridium", count: 12 },
  { slug: "diamond", label: "Diamond", count: 9 },
  { slug: "murano", label: "Murano", count: 0 },
  { slug: "colorpedia", label: "Colorpedia", count: 5 },
]

const meta = {
  title: "Composed/CheckboxFilter",
  component: CheckboxFilter,
  parameters: { layout: "padded" },
  argTypes: {},
} satisfies Meta<typeof CheckboxFilter>

export default meta
type Story = StoryObj<typeof meta>

function CheckboxFilterPlayground() {
  const [active, setActive] = useState<string[]>(["waterglass"])

  const handleChange = (slug: string) => {
    setActive((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }

  return (
    <div className="w-64">
      <CheckboxFilter
        options={MOCK_OPTIONS}
        activeValues={active}
        onChange={handleChange}
      />
    </div>
  )
}

export const Playground: Story = {
  render: () => <CheckboxFilterPlayground />,
}
