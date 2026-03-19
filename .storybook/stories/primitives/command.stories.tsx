import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

const meta = {
  title: "Primitives/Command",
  component: Command,
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
      <Command
        style={{
          maxWidth: "28rem",
          borderRadius: "0.75rem",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        }}
      >
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search Emoji</CommandItem>
            <CommandItem>Calculator</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>
              Profile
              <CommandShortcut>Ctrl+P</CommandShortcut>
            </CommandItem>
            <CommandItem>
              Billing
              <CommandShortcut>Ctrl+B</CommandShortcut>
            </CommandItem>
            <CommandItem>
              Settings
              <CommandShortcut>Ctrl+,</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
}
