import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { GenIntro } from "@/components/blocks/GenIntro"

const meta = {
  title: "Blocks/GenIntro",
  component: GenIntro,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof GenIntro>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => (
    <GenIntro
      {...args}
      title="Bathroom mosaics: an elegant and versatile interior solution"
      subtitle="Interior Design"
      bodyHtml="<p>The bathroom is a luxurious place in any home, a daily sanctuary dedicated to self-care and personal well-being. With this in mind, it is key to create a space that reflects your individual style and offers an experience for all the senses.</p><p>Mosaics, an elegant and versatile interior design solution, bring an exclusive and bespoke touch to any bathroom.</p>"
      imageSrc="https://www.sicis-stage.com/sites/default/files/ambiente/blocchi/img/SICIS_Bathroom-mosaic_intro.png"
      imageAlt="bathroom mosaic"
      linkHref="#"
      linkLabel="Discover more"
    />
  ),
}
