import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

const meta = {
  title: "Primitives/Card",
  component: Card,
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm"],
    },
  },
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    size: "default",
  },
  render: ({ size }) => (
    <Card size={size} style={{ maxWidth: 420 }}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>
          This is a brief description of the card content.
        </CardDescription>
        <CardAction>
          <button
            style={{
              fontSize: "0.75rem",
              padding: "0.25rem 0.5rem",
              borderRadius: 4,
              border: "1px solid #ccc",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Action
          </button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>
          This is the main content area of the card. You can place any content
          here including text, images, or other components.
        </p>
      </CardContent>
      <CardFooter>
        <span style={{ fontSize: "0.75rem", color: "#888" }}>
          Card footer content
        </span>
      </CardFooter>
    </Card>
  ),
}
