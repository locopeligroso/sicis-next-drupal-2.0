import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
} from "@/components/ui/avatar"

const meta = {
  title: "Primitives/Avatar",
  component: Avatar,
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
  },
} satisfies Meta<typeof Avatar>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    size: "default",
  },
  render: ({ size }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Avatar with image and fallback
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Avatar size={size}>
            <AvatarImage
              src="https://i.pravatar.cc/150?u=avatar1"
              alt="User avatar"
            />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar size={size}>
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
          <Avatar size={size}>
            <AvatarImage
              src="https://i.pravatar.cc/150?u=avatar2"
              alt="User avatar"
            />
            <AvatarFallback>CD</AvatarFallback>
            <AvatarBadge />
          </Avatar>
        </div>
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Avatar Group
        </div>
        <AvatarGroup>
          <Avatar size={size}>
            <AvatarImage
              src="https://i.pravatar.cc/150?u=group1"
              alt="User 1"
            />
            <AvatarFallback>U1</AvatarFallback>
          </Avatar>
          <Avatar size={size}>
            <AvatarImage
              src="https://i.pravatar.cc/150?u=group2"
              alt="User 2"
            />
            <AvatarFallback>U2</AvatarFallback>
          </Avatar>
          <Avatar size={size}>
            <AvatarImage
              src="https://i.pravatar.cc/150?u=group3"
              alt="User 3"
            />
            <AvatarFallback>U3</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+5</AvatarGroupCount>
        </AvatarGroup>
      </div>
    </div>
  ),
}
