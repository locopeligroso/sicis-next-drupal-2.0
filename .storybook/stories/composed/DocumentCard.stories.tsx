import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { DocumentCard } from "@/components/composed/DocumentCard"

const meta = {
  title: "Composed/DocumentCard",
  component: DocumentCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DocumentCard>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-xs">
      <DocumentCard
        {...args}
        item={{
          title: "SICIS Colorpedia",
          type: "Catalogue",
          imageSrc: "https://placehold.co/400x400/e2e2e2/666?text=Colorpedia",
          href: "#",
        }}
      />
    </div>
  ),
}
