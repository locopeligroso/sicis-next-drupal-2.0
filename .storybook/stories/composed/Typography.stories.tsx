import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Typography,
  typographyStyles,
  type TextRole,
} from "@/components/composed/Typography"

const allRoles = Object.keys(typographyStyles) as TextRole[]

const meta = {
  title: "Composed/Typography",
  component: Typography,
  argTypes: {
    textRole: {
      control: "select",
      options: allRoles,
    },
  },
} satisfies Meta<typeof Typography>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    textRole: "body-md",
  },
  render: (args) => (
    <Typography {...args}>
      The quick brown fox jumps over the lazy dog.
    </Typography>
  ),
}
