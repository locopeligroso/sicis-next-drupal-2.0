import type { Meta, StoryObj } from "@storybook/react"
import { ProductGallery } from "@/components/blocks/ProductGallery"

const MOCK_IMAGES = Array.from({ length: 8 }, (_, i) => ({
  src: `https://placehold.co/400x400/${["e2e2e2", "d4d4d4", "c6c6c6", "b8b8b8", "aaaaaa", "9c9c9c", "8e8e8e", "808080"][i]}/666?text=${i + 1}`,
  alt: `Gallery image ${i + 1}`,
}))

const meta: Meta<typeof ProductGallery> = {
  title: "Blocks/ProductGallery",
  component: ProductGallery,
  parameters: { layout: "fullscreen" },
}
export default meta

type Story = StoryObj<typeof ProductGallery>

export const Playground: Story = {
  render: () => <ProductGallery images={MOCK_IMAGES} />,
}

export const FewImages: Story = {
  render: () => <ProductGallery images={MOCK_IMAGES.slice(0, 3)} />,
}
