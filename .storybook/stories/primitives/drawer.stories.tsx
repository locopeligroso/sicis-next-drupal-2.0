import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const meta = {
  title: "Primitives/Drawer",
  component: Drawer,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Move Goal</DrawerTitle>
          <DrawerDescription>
            Set your daily activity goal.
          </DrawerDescription>
        </DrawerHeader>
        <div
          style={{
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            350
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
            }}
          >
            calories/day
          </p>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}
