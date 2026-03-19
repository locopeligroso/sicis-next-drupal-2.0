import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const meta = {
  title: "Primitives/Sheet",
  component: Sheet,
  argTypes: {
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    showCloseButton: {
      control: "boolean",
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    side: "right",
    showCloseButton: true,
  },
  render: ({ side, showCloseButton }) => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        Open Sheet
      </SheetTrigger>
      <SheetContent side={side} showCloseButton={showCloseButton}>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>
            This is a sheet that slides in from the {side} side of the screen.
          </SheetDescription>
        </SheetHeader>
        <div style={{ padding: "0 1rem", flex: 1 }}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            Sheet content goes here. You can place any content inside a sheet,
            such as forms, navigation menus, or detailed information panels.
          </p>
        </div>
        <SheetFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}
