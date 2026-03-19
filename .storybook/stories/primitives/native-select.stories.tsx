import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select"

const meta: Meta<typeof NativeSelect> = {
  title: "Primitives/NativeSelect",
  component: NativeSelect,
  args: {
    disabled: false,
    size: "default",
  },
  argTypes: {
    disabled: { control: "boolean" },
    size: {
      control: "select",
      options: ["sm", "default"],
    },
  },
}

export default meta
type Story = StoryObj<typeof NativeSelect>

export const Playground: Story = {
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOption value="" disabled>
        Select a fruit...
      </NativeSelectOption>
      <NativeSelectOptGroup label="Citrus">
        <NativeSelectOption value="orange">Orange</NativeSelectOption>
        <NativeSelectOption value="lemon">Lemon</NativeSelectOption>
        <NativeSelectOption value="grapefruit">Grapefruit</NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="Berries">
        <NativeSelectOption value="strawberry">Strawberry</NativeSelectOption>
        <NativeSelectOption value="blueberry">Blueberry</NativeSelectOption>
        <NativeSelectOption value="raspberry">Raspberry</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  ),
}

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.5rem",
          }}
        >
          Size: default
        </p>
        <NativeSelect size="default">
          <NativeSelectOption value="one">Option one</NativeSelectOption>
          <NativeSelectOption value="two">Option two</NativeSelectOption>
        </NativeSelect>
      </div>
      <div>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.5rem",
          }}
        >
          Size: sm
        </p>
        <NativeSelect size="sm">
          <NativeSelectOption value="one">Option one</NativeSelectOption>
          <NativeSelectOption value="two">Option two</NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
  ),
}
