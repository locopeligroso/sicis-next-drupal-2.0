import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ButtonGroup } from "@/components/ui/button-group"
import { Button } from "@/components/ui/button"

const meta = {
  title: "Primitives/ButtonGroup",
  component: ButtonGroup,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof ButtonGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    orientation: "horizontal",
  },
  render: ({ orientation }) => (
    <ButtonGroup orientation={orientation}>
      <Button variant="outline">Left</Button>
      <Button variant="outline">Center</Button>
      <Button variant="outline">Right</Button>
    </ButtonGroup>
  ),
}

const orientations = ["horizontal", "vertical"] as const

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "3rem", alignItems: "flex-start" }}>
      {orientations.map((orientation) => (
        <div key={orientation}>
          <div
            style={{
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {orientation}
          </div>
          <ButtonGroup orientation={orientation}>
            <Button variant="outline">First</Button>
            <Button variant="outline">Second</Button>
            <Button variant="outline">Third</Button>
          </ButtonGroup>
        </div>
      ))}
    </div>
  ),
}
