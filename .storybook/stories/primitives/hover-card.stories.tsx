import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

const meta = {
  title: "Primitives/HoverCard",
  component: HoverCard,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "6rem 0",
      }}
    >
      <HoverCard>
        <HoverCardTrigger
          render={
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "underline",
                textUnderlineOffset: "4px",
                cursor: "pointer",
              }}
            />
          }
        >
          @github
        </HoverCardTrigger>
        <HoverCardContent>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "9999px",
                backgroundColor: "var(--muted)",
                flexShrink: 0,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                @github
              </h4>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--muted-foreground)",
                }}
              >
                The GitHub platform for developers to collaborate on code.
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingTop: "0.5rem",
                  gap: "0.25rem",
                  fontSize: "0.75rem",
                  color: "var(--muted-foreground)",
                }}
              >
                Joined December 2007
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
}
