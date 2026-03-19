import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

const meta = {
  title: "Primitives/ContextMenu",
  component: ContextMenu,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

function ContextMenuPlayground() {
  const [showBookmarks, setShowBookmarks] = React.useState(true)
  const [showFullUrls, setShowFullUrls] = React.useState(false)
  const [person, setPerson] = React.useState("pedro")

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "4rem 0",
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20rem",
            height: "10rem",
            borderRadius: "0.5rem",
            border: "2px dashed var(--border)",
            fontSize: "0.875rem",
            color: "var(--muted-foreground)",
          }}
        >
          Right-click here
        </ContextMenuTrigger>
        <ContextMenuContent style={{ minWidth: "14rem" }}>
          <ContextMenuItem>
            Back
            <ContextMenuShortcut>Alt+Left</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Forward
            <ContextMenuShortcut>Alt+Right</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Reload
            <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Save Page As...</ContextMenuItem>
              <ContextMenuItem>Create Shortcut...</ContextMenuItem>
              <ContextMenuItem>Name Window...</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>Developer Tools</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>Options</ContextMenuLabel>
            <ContextMenuCheckboxItem
              checked={showBookmarks}
              onCheckedChange={setShowBookmarks}
            >
              Show Bookmarks Bar
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={showFullUrls}
              onCheckedChange={setShowFullUrls}
            >
              Show Full URLs
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>People</ContextMenuLabel>
            <ContextMenuRadioGroup value={person} onValueChange={setPerson}>
              <ContextMenuRadioItem value="pedro">
                Pedro Duarte
              </ContextMenuRadioItem>
              <ContextMenuRadioItem value="colm">
                Colm Tuite
              </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

export const Playground: Story = {
  render: () => <ContextMenuPlayground />,
}
