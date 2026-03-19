import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { AlertCircle, Info } from "lucide-react"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

const meta = {
  title: "Primitives/Alert",
  component: Alert,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
    },
  },
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    variant: "default",
  },
  render: ({ variant }) => (
    <Alert variant={variant}>
      {variant === "destructive" ? <AlertCircle /> : <Info />}
      <AlertTitle>
        {variant === "destructive" ? "Error" : "Information"}
      </AlertTitle>
      <AlertDescription>
        {variant === "destructive"
          ? "Something went wrong. Please try again later."
          : "This is an informational alert message."}
      </AlertDescription>
    </Alert>
  ),
}

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          default
        </div>
        <Alert variant="default">
          <Info />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            This is an informational alert with a default variant.
          </AlertDescription>
        </Alert>
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          destructive
        </div>
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Something went wrong. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  ),
}
