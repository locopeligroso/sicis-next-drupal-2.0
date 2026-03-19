import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { toast } from "sonner"

import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"

const meta = {
  title: "Primitives/Sonner",
  component: Toaster,
} satisfies Meta<typeof Toaster>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <div>
      <Toaster />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <Button
          variant="default"
          onClick={() => toast("This is a default toast message.")}
        >
          Default Toast
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success("Action completed successfully.")}
        >
          Success Toast
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error("Something went wrong.")}
        >
          Error Toast
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.info("Here is some useful info.")}
        >
          Info Toast
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.warning("Please be careful.")}
        >
          Warning Toast
        </Button>
      </div>
    </div>
  ),
}
