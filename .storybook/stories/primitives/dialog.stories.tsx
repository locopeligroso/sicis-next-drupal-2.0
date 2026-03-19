import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const meta = {
  title: "Primitives/Dialog",
  component: Dialog,
  argTypes: {
    showCloseButton: {
      control: "boolean",
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    showCloseButton: true,
  },
  render: ({ showCloseButton }) => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open Dialog
      </DialogTrigger>
      <DialogContent showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you are done.
          </DialogDescription>
        </DialogHeader>
        <div
          style={{
            display: "grid",
            gap: "1rem",
            padding: "1rem 0",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            Your profile information will be updated across all services.
          </p>
        </div>
        <DialogFooter showCloseButton>
          <Button>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
