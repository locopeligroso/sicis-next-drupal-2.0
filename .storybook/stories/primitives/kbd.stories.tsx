import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Kbd, KbdGroup } from "@/components/ui/kbd"

const meta: Meta<typeof Kbd> = {
  title: "Primitives/Kbd",
  component: Kbd,
}

export default meta
type Story = StoryObj<typeof Kbd>

export const Playground: Story = {
  render: () => <Kbd>K</Kbd>,
}

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.75rem",
          }}
        >
          Single keys
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Kbd>Esc</Kbd>
          <Kbd>Tab</Kbd>
          <Kbd>Enter</Kbd>
          <Kbd>Space</Kbd>
        </div>
      </div>
      <div>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.75rem",
          }}
        >
          KbdGroup (shortcut combinations)
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>C</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>Cmd</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>Alt</Kbd>
            <Kbd>F4</Kbd>
          </KbdGroup>
        </div>
      </div>
    </div>
  ),
}
