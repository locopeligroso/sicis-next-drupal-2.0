import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SpecProductResources } from "@/components/blocks/SpecProductResources"
import type { DocumentCardItem } from "@/components/composed/DocumentCard"

const MOCK_DOCUMENTS: DocumentCardItem[] = [
  { title: "SICIS Colorpedia", type: "Catalogue", imageSrc: "https://placehold.co/400x400/e2e2e2/666?text=Colorpedia", href: "#" },
  { title: "SICIS Pools 2026", type: "Catalogue", imageSrc: "https://placehold.co/400x400/d4d4d4/666?text=Pools", href: "#" },
  { title: "SICIS Neoglass Collection", type: "Catalogue", imageSrc: "https://placehold.co/400x400/c6c6c6/666?text=Neoglass", href: "#" },
  { title: "What makes unique SICIS' mosaics", type: "Catalogue", imageSrc: "https://placehold.co/400x400/b8b8b8/666?text=Unique", href: "#" },
  { title: "Bathing with SICIS", type: "Catalogue", imageSrc: "https://placehold.co/400x400/aaaaaa/666?text=Bathing", href: "#" },
]

const meta = {
  title: "Blocks/SpecProductResources",
  component: SpecProductResources,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SpecProductResources>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => <SpecProductResources {...args} documents={MOCK_DOCUMENTS} />,
}
