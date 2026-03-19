import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldContent,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const meta = {
  title: "Primitives/Field",
  component: Field,
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal", "responsive"],
    },
  },
} satisfies Meta<typeof Field>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    orientation: "vertical",
  },
  render: ({ orientation }) => (
    <Field orientation={orientation}>
      <FieldLabel>Email</FieldLabel>
      <FieldContent>
        <Input type="email" placeholder="you@example.com" />
        <FieldDescription>
          We will never share your email with anyone.
        </FieldDescription>
      </FieldContent>
    </Field>
  ),
}

const orientations = ["vertical", "horizontal", "responsive"] as const

export const Showcase: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {orientations.map((orientation) => (
        <div key={orientation}>
          <div
            style={{
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {orientation}
          </div>
          <Field orientation={orientation}>
            <FieldLabel>Email</FieldLabel>
            <FieldContent>
              <Input type="email" placeholder="you@example.com" />
              <FieldDescription>
                We will never share your email with anyone.
              </FieldDescription>
            </FieldContent>
          </Field>
        </div>
      ))}
    </div>
  ),
}
