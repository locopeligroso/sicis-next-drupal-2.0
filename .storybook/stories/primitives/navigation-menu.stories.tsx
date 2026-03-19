import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

const meta = {
  title: "Primitives/NavigationMenu",
  component: NavigationMenu,
} satisfies Meta<typeof NavigationMenu>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting Started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div
              style={{
                display: "grid",
                gap: "0.25rem",
                width: 280,
              }}
            >
              <NavigationMenuLink href="#">Introduction</NavigationMenuLink>
              <NavigationMenuLink href="#">Installation</NavigationMenuLink>
              <NavigationMenuLink href="#">Quick Start</NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div
              style={{
                display: "grid",
                gap: "0.25rem",
                width: 280,
              }}
            >
              <NavigationMenuLink href="#">Button</NavigationMenuLink>
              <NavigationMenuLink href="#">Card</NavigationMenuLink>
              <NavigationMenuLink href="#">Dialog</NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#">Documentation</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
}
