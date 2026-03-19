import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const meta = {
  title: "Primitives/RadioGroup",
  component: RadioGroup,
} satisfies Meta<typeof RadioGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1" style={{ maxWidth: 280 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <RadioGroupItem value="option-1" id="option-1" />
        <Label htmlFor="option-1">Option One</Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <RadioGroupItem value="option-2" id="option-2" />
        <Label htmlFor="option-2">Option Two</Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <RadioGroupItem value="option-3" id="option-3" />
        <Label htmlFor="option-3">Option Three</Label>
      </div>
    </RadioGroup>
  ),
}
