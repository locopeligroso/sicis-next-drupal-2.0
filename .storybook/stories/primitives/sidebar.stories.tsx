import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
  Home,
  Inbox,
  Settings,
  Search,
  Calendar,
  User,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const menuItems = [
  { label: "Home", icon: Home },
  { label: "Inbox", icon: Inbox, badge: "12" },
  { label: "Calendar", icon: Calendar },
  { label: "Search", icon: Search },
  { label: "Settings", icon: Settings },
]

function SidebarDemo({
  variant,
  side,
  collapsible,
}: {
  variant: "sidebar" | "floating" | "inset"
  side: "left" | "right"
  collapsible: "offcanvas" | "icon" | "none"
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3rem",
        } as React.CSSProperties
      }
    >
      <Sidebar variant={variant} side={side} collapsible={collapsible}>
        <SidebarHeader>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.25rem",
            }}
          >
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "0.375rem",
                background: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
            >
              S
            </div>
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              Sidebar
            </span>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton tooltip={item.label}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <User />
                <span>John Doe</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "1rem",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <SidebarTrigger />
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            Page Content
          </span>
        </header>
        <div style={{ padding: "1.5rem" }}>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Main content area. Use the trigger or rail to toggle the sidebar.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

const meta = {
  title: "Primitives/Sidebar",
  component: SidebarDemo,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["sidebar", "floating", "inset"],
    },
    side: {
      control: "select",
      options: ["left", "right"],
    },
    collapsible: {
      control: "select",
      options: ["offcanvas", "icon", "none"],
    },
  },
} satisfies Meta<typeof SidebarDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    variant: "sidebar",
    side: "left",
    collapsible: "offcanvas",
  },
}

const variants = ["sidebar", "floating", "inset"] as const

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {variants.map((variant) => (
        <div key={variant}>
          <div
            style={{
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            variant: {variant}
          </div>
          <div
            style={{
              height: "20rem",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              overflow: "hidden",
            }}
          >
            <SidebarProvider
              defaultOpen={true}
              style={
                {
                  "--sidebar-width": "14rem",
                  "--sidebar-width-icon": "3rem",
                  height: "100%",
                  minHeight: "unset",
                } as React.CSSProperties
              }
            >
              <Sidebar variant={variant} collapsible="icon">
                <SidebarHeader>
                  <span
                    style={{ fontWeight: 600, fontSize: "0.75rem", padding: "0.25rem" }}
                  >
                    {variant}
                  </span>
                </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {menuItems.slice(0, 3).map((item) => (
                          <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton>
                              <item.icon />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
              <SidebarInset>
                <div style={{ padding: "1rem", fontSize: "0.75rem", color: "#6b7280" }}>
                  Content area
                </div>
              </SidebarInset>
            </SidebarProvider>
          </div>
        </div>
      ))}
    </div>
  ),
}
