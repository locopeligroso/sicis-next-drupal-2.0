import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProductCarousel, type ProductCarouselSlide } from "@/components/composed/ProductCarousel"

const MOCK_SLIDES: ProductCarouselSlide[] = [
  { type: "image", src: "https://placehold.co/800x600/e2e2e2/666?text=Mosaic+1", alt: "550 Barrels - Foglio", thumbSrc: "https://placehold.co/120x120/e2e2e2/666?text=1" },
  { type: "image", src: "https://placehold.co/800x600/d4d4d4/666?text=Mosaic+2", alt: "550 Barrels - Detail", thumbSrc: "https://placehold.co/120x120/d4d4d4/666?text=2" },
  { type: "image", src: "https://placehold.co/800x600/c6c6c6/666?text=Mosaic+3", alt: "550 Barrels - Ambience", thumbSrc: "https://placehold.co/120x120/c6c6c6/666?text=3" },
  { type: "image", src: "https://placehold.co/800x600/b8b8b8/666?text=Mosaic+4", alt: "550 Barrels - Close up", thumbSrc: "https://placehold.co/120x120/b8b8b8/666?text=4" },
  { type: "image", src: "https://placehold.co/800x600/aaaaaa/666?text=Mosaic+5", alt: "550 Barrels - Pattern", thumbSrc: "https://placehold.co/120x120/aaaaaa/666?text=5" },
  { type: "image", src: "https://placehold.co/800x600/9c9c9c/666?text=Mosaic+6", alt: "550 Barrels - Room", thumbSrc: "https://placehold.co/120x120/9c9c9c/666?text=6" },
  { type: "image", src: "https://placehold.co/800x600/8e8e8e/666?text=Mosaic+7", alt: "550 Barrels - Pool", thumbSrc: "https://placehold.co/120x120/8e8e8e/666?text=7" },
  { type: "image", src: "https://placehold.co/800x600/808080/666?text=Mosaic+8", alt: "550 Barrels - Wall", thumbSrc: "https://placehold.co/120x120/808080/666?text=8" },
  { type: "video", src: "https://example.com/video.mp4" },
  { type: "static", src: "/images/usa-mosaic-quality.jpg", alt: "Quality certification" },
]

const meta = {
  title: "Composed/ProductCarousel",
  component: ProductCarousel,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    ratio: { control: "number" },
  },
} satisfies Meta<typeof ProductCarousel>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    ratio: 4 / 3,
  },
  render: (args) => (
    <div className="w-full max-w-lg">
      <ProductCarousel {...args} slides={MOCK_SLIDES} />
    </div>
  ),
}
