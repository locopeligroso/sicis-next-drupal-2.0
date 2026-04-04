import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProductGrid } from "@/components/composed/ProductGrid"

const MOCK_PRODUCTS = [
  {
    id: "1",
    type: "prodotto_mosaico",
    title: "Crackle Azure",
    subtitle: "Waterglass Collection",
    image: { url: "https://placehold.co/400x400/c7d2e3/333?text=Azure", width: null, height: null },
    price: null,
    priceOnDemand: true,
    path: "#",
  },
  {
    id: "2",
    type: "prodotto_mosaico",
    title: "Iridium Gold",
    subtitle: "Iridium Collection",
    image: { url: "https://placehold.co/400x400/eab308/333?text=Gold", width: null, height: null },
    price: null,
    priceOnDemand: true,
    path: "#",
  },
  {
    id: "3",
    type: "prodotto_mosaico",
    title: "Coloritalia Pearl",
    subtitle: "Coloritalia Collection",
    image: { url: "https://placehold.co/400x400/f5f5f5/666?text=Pearl", width: null, height: null },
    price: null,
    priceOnDemand: true,
    path: "#",
  },
  {
    id: "4",
    type: "prodotto_mosaico",
    title: "Murano Emerald",
    subtitle: "Murano Collection",
    image: { url: "https://placehold.co/400x400/34d399/333?text=Emerald", width: null, height: null },
    price: null,
    priceOnDemand: true,
    path: "#",
  },
  {
    id: "5",
    type: "prodotto_mosaico",
    title: "Firefly Ruby",
    subtitle: "Firefly Collection",
    image: { url: "https://placehold.co/400x400/ef4444/fff?text=Ruby", width: null, height: null },
    price: null,
    priceOnDemand: true,
    path: "#",
  },
  {
    id: "6",
    type: "prodotto_mosaico",
    title: "Glimmer Onyx",
    subtitle: "Glimmer Collection",
    image: { url: "https://placehold.co/400x400/1a1a1a/fff?text=Onyx", width: null, height: null },
    price: null,
    priceOnDemand: true,
    path: "#",
  },
  {
    id: "7",
    type: "prodotto_mosaico",
    title: "Luxe Amber",
    subtitle: "Luxe Collection",
    image: { url: "https://placehold.co/400x400/f59e0b/333?text=Amber", width: null, height: null },
    price: null,
    priceOnDemand: true,
    path: "#",
  },
  {
    id: "8",
    type: "prodotto_mosaico",
    title: "Diamond Ivory",
    subtitle: "Diamond Collection",
    image: { url: "https://placehold.co/400x400/fefce8/666?text=Ivory", width: null, height: null },
    price: null,
    priceOnDemand: true,
    path: "#",
  },
]

const meta = {
  title: "Composed/ProductGrid",
  component: ProductGrid,
  parameters: { layout: "padded" },
  argTypes: {
    productCardRatio: {
      control: "select",
      options: ["1/1", "3/4", "4/3", "16/9"],
    },
  },
} satisfies Meta<typeof ProductGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    productCardRatio: "1/1",
  },
  render: (args) => <ProductGrid {...args} products={MOCK_PRODUCTS} />,
}
