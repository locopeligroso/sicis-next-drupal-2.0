import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { GenGallery } from "@/components/blocks/GenGallery"
import type { GenGallerySlide } from "@/components/blocks/GenGallery"

const MOCK_SLIDES: GenGallerySlide[] = [
  { src: "https://placehold.co/1200x800/1a1a2e/fff?text=Landscape+3:2", alt: "Gallery image 1", caption: "Mosaic detail in natural light", width: 1200, height: 800 },
  { src: "https://placehold.co/800x1200/2d1b2e/fff?text=Portrait+2:3", alt: "Gallery image 2", caption: "Handcrafted pattern close-up", width: 800, height: 1200 },
  { src: "https://placehold.co/1200x675/1b2e1b/fff?text=Wide+16:9", alt: "Gallery image 3", width: 1200, height: 675 },
  { src: "https://placehold.co/1000x1000/2e2b1b/fff?text=Square+1:1", alt: "Gallery image 4", caption: "Installation in luxury bathroom", width: 1000, height: 1000 },
  { src: "https://placehold.co/1200x665/1b2a2e/fff?text=Custom+1.8:1", alt: "Gallery image 5", width: 1200, height: 665 },
  { src: "https://placehold.co/900x600/2e1b1b/fff?text=Landscape+3:2", alt: "Gallery image 6", caption: "Pool mosaic design", width: 900, height: 600 },
]

const meta = {
  title: "Blocks/GenGallery",
  component: GenGallery,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    title: { control: "text" },
  },
} satisfies Meta<typeof GenGallery>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    title: "Gallery",
    slides: MOCK_SLIDES,
  },
}
