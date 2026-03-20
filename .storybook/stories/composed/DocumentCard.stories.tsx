import type { Meta, StoryObj } from "@storybook/react"
import { DocumentCard } from "@/components/composed/DocumentCard"

const meta: Meta<typeof DocumentCard> = {
  title: "Composed/DocumentCard",
  component: DocumentCard,
  parameters: { layout: "centered" },
}
export default meta

type Story = StoryObj<typeof DocumentCard>

export const WithImage: Story = {
  render: () => (
    <div className="max-w-xs">
      <DocumentCard item={{
        title: "SICIS Colorpedia",
        type: "Catalogue",
        imageSrc: "https://placehold.co/400x400/e2e2e2/666?text=Colorpedia",
        href: "#",
      }} />
    </div>
  ),
}

export const WithoutImage: Story = {
  render: () => (
    <div className="max-w-xs">
      <DocumentCard item={{
        title: "Product installation manual",
        type: "Guide",
        href: "#",
      }} />
    </div>
  ),
}

export const NoLink: Story = {
  render: () => (
    <div className="max-w-xs">
      <DocumentCard item={{
        title: "SICIS Pools 2026",
        type: "Catalogue",
        imageSrc: "https://placehold.co/400x400/d4d4d4/666?text=Pools",
      }} />
    </div>
  ),
}
