import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const meta = {
  title: "Primitives/Select",
  component: Select,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "2rem 0",
      }}
    >
      <Select>
        <SelectTrigger style={{ width: "12rem" }}>
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="blueberry">Blueberry</SelectItem>
            <SelectItem value="grapes">Grapes</SelectItem>
            <SelectItem value="pineapple">Pineapple</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem value="carrot">Carrot</SelectItem>
            <SelectItem value="celery">Celery</SelectItem>
            <SelectItem value="mushroom">Mushroom</SelectItem>
            <SelectItem value="potato">Potato</SelectItem>
            <SelectItem value="tomato">Tomato</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
}
