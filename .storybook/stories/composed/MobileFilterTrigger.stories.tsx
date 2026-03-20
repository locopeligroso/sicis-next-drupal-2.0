import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { NextIntlClientProvider } from "next-intl"
import { MobileFilterTrigger } from "@/components/composed/MobileFilterTrigger"

const MESSAGES = {
  filters: {
    title: "Filters",
    activeCount: "Filters ({count})",
    showResults: "Show {count} products",
  },
}

const meta = {
  title: "Composed/MobileFilterTrigger",
  component: MobileFilterTrigger,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={MESSAGES}>
        <div className="relative min-h-[400px] p-4">
          <p className="text-muted-foreground text-sm">
            The filter FAB button is fixed at the bottom center (visible on mobile viewports).
            Click it to open the filter sheet.
          </p>
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
  argTypes: {
    activeFilterCount: { control: { type: "number", min: 0, max: 10 } },
    totalCount: { control: { type: "number", min: 0, max: 500 } },
  },
} satisfies Meta<typeof MobileFilterTrigger>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    activeFilterCount: 3,
    totalCount: 42,
  },
  render: (args) => (
    <MobileFilterTrigger {...args}>
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Collection</h3>
          <div className="flex flex-col gap-1">
            {["Waterglass", "Coloritalia", "Crackle", "Iridium"].map((name) => (
              <button
                key={name}
                className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Color</h3>
          <div className="flex flex-col gap-1">
            {["Blue", "Gold", "White", "Red", "Green"].map((name) => (
              <button
                key={name}
                className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </MobileFilterTrigger>
  ),
}
