import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SpecProductHero } from "@/components/blocks/SpecProductHero"
import type { ProductCarouselSlide } from "@/components/composed/ProductCarousel"

const MOCK_SLIDES: ProductCarouselSlide[] = [
  { type: "image", src: "https://placehold.co/800x800/e2e2e2/666?text=Mosaic+1", alt: "550 Barrels - Foglio", thumbSrc: "https://placehold.co/120x120/e2e2e2/666?text=1" },
  { type: "image", src: "https://placehold.co/800x800/d4d4d4/666?text=Mosaic+2", alt: "550 Barrels - Detail", thumbSrc: "https://placehold.co/120x120/d4d4d4/666?text=2" },
  { type: "image", src: "https://placehold.co/800x800/c6c6c6/666?text=Mosaic+3", alt: "550 Barrels - Ambience", thumbSrc: "https://placehold.co/120x120/c6c6c6/666?text=3" },
  { type: "image", src: "https://placehold.co/800x800/b8b8b8/666?text=Mosaic+4", alt: "550 Barrels - Close up", thumbSrc: "https://placehold.co/120x120/b8b8b8/666?text=4" },
  { type: "video", src: "https://example.com/video.mp4" },
  { type: "static", src: "/images/usa-mosaic-quality.jpg", alt: "Quality certification" },
]

const meta = {
  title: "Blocks/SpecProductHero",
  component: SpecProductHero,
  parameters: { layout: "fullscreen" },
  argTypes: {
    hasSample: { control: "boolean" },
    inStock: { control: "boolean" },
    price: { control: "text" },
  },
} satisfies Meta<typeof SpecProductHero>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    hasSample: true,
    inStock: true,
    price: "$155.00",
  },
  render: (args) => (
    <SpecProductHero
      {...args}
      title="550 Barrels"
      collection="Neocolibri - barrels"
      collectionHref="/en/mosaic/neocolibri-barrels"
      description="Smalto glass mosaic in transparent, transparent iridescent and opaque. The mosaic chips are finished both sides, the shape is penny round with a smooth surface and straight edges. 6 mm nominal thickness."
      slides={MOCK_SLIDES}
      priceUnit="/sqft"
      shippingWarehouse="North America Warehouse"
      shippingTime="2-3 weeks"
      discoverUrl="#"
    />
  ),
}
