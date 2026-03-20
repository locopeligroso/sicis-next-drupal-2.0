import type { Meta, StoryObj } from "@storybook/react"
import { ProductResources } from "@/components/blocks/ProductResources"
import type { DocumentCardItem } from "@/components/composed/DocumentCard"

const MOCK_DOCUMENTS: DocumentCardItem[] = [
  { title: "SICIS Colorpedia", type: "Catalogue", imageSrc: "https://placehold.co/400x400/e2e2e2/666?text=Colorpedia", href: "#" },
  { title: "SICIS Pools 2026", type: "Catalogue", imageSrc: "https://placehold.co/400x400/d4d4d4/666?text=Pools", href: "#" },
  { title: "SICIS Neoglass Collection", type: "Catalogue", imageSrc: "https://placehold.co/400x400/c6c6c6/666?text=Neoglass", href: "#" },
  { title: "What makes unique SICIS' mosaics", type: "Catalogue", imageSrc: "https://placehold.co/400x400/b8b8b8/666?text=Unique", href: "#" },
  { title: "Bathing with SICIS", type: "Catalogue", imageSrc: "https://placehold.co/400x400/aaaaaa/666?text=Bathing", href: "#" },
]

const meta: Meta<typeof ProductResources> = {
  title: "Blocks/ProductResources",
  component: ProductResources,
  parameters: { layout: "fullscreen" },
}
export default meta

type Story = StoryObj<typeof ProductResources>

export const Playground: Story = {
  render: () => <ProductResources documents={MOCK_DOCUMENTS} />,
}

export const FewDocuments: Story = {
  render: () => <ProductResources documents={MOCK_DOCUMENTS.slice(0, 2)} />,
}
