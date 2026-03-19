import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

const meta = {
  title: "Primitives/Accordion",
  component: Accordion,
  argTypes: {
    openMultiple: {
      control: "boolean",
      name: "openMultiple",
    },
  },
} satisfies Meta<typeof Accordion>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    openMultiple: false,
  },
  render: ({ openMultiple }) => (
    <Accordion openMultiple={openMultiple} style={{ maxWidth: 480 }}>
      <AccordionItem>
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern for accordions.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem>
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that match the other components
          aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem>
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It is animated by default, but you can disable it if you prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}
