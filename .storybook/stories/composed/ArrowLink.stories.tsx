import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ArrowLink } from "@/components/composed/ArrowLink"

const meta = {
  title: "Composed/ArrowLink",
  component: ArrowLink,
  argTypes: {
    external: { control: "boolean" },
    textRole: {
      control: "select",
      options: ["body-sm", "body-md", "body-lg"],
    },
  },
} satisfies Meta<typeof ArrowLink>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    href: "#",
    label: "Discover more",
    external: false,
    textRole: "body-md",
  },
  render: (args) => <ArrowLink {...args} />,
}
