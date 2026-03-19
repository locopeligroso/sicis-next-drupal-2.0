import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Search, Eye } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
} from "@/components/ui/input-group"

const meta = {
  title: "Primitives/InputGroup",
  component: InputGroup,
} satisfies Meta<typeof InputGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <InputGroupText>
          <Search />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="Search..." />
      <InputGroupAddon align="inline-end">
        <InputGroupButton>
          <Eye />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const Showcase: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        maxWidth: "24rem",
      }}
    >
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Icon prefix
        </div>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>
              <Search />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="Search..." />
        </InputGroup>
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Button suffix
        </div>
        <InputGroup>
          <InputGroupInput placeholder="Enter a value..." />
          <InputGroupAddon align="inline-end">
            <InputGroupButton>
              <Eye />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Icon prefix + button suffix
        </div>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>
              <Search />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="Search..." />
          <InputGroupAddon align="inline-end">
            <InputGroupButton>
              <Eye />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Text addon prefix
        </div>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="example.com" />
        </InputGroup>
      </div>
    </div>
  ),
}
