import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const meta = {
  title: "Primitives/Tabs",
  component: TabsList,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "line"],
    },
  },
} satisfies Meta<typeof TabsList>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    variant: "default",
  },
  render: ({ variant }) => (
    <Tabs defaultValue="tab1">
      <TabsList variant={variant}>
        <TabsTrigger value="tab1">Account</TabsTrigger>
        <TabsTrigger value="tab2">Settings</TabsTrigger>
        <TabsTrigger value="tab3">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Account settings content.</TabsContent>
      <TabsContent value="tab2">Settings content.</TabsContent>
      <TabsContent value="tab3">Notifications content.</TabsContent>
    </Tabs>
  ),
}

const variants = ["default", "line"] as const

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "3rem" }}>
      {variants.map((variant) => (
        <div key={variant} style={{ flex: 1 }}>
          <div
            style={{
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {variant}
          </div>
          <Tabs defaultValue="tab1">
            <TabsList variant={variant}>
              <TabsTrigger value="tab1">Account</TabsTrigger>
              <TabsTrigger value="tab2">Settings</TabsTrigger>
              <TabsTrigger value="tab3">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">Account content.</TabsContent>
            <TabsContent value="tab2">Settings content.</TabsContent>
            <TabsContent value="tab3">Notifications content.</TabsContent>
          </Tabs>
        </div>
      ))}
    </div>
  ),
}
