import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"

const meta = {
  title: "Primitives/Carousel",
  component: Carousel,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Carousel>

export default meta

type Story = StoryObj<typeof meta>

const colors = ["#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569"]

export const Playground: Story = {
  args: {
    orientation: "horizontal",
  },
  render: ({ orientation }) => (
    <div style={{ padding: "3rem" }}>
      <Carousel
        orientation={orientation}
        style={{ maxWidth: 320, margin: "0 auto" }}
      >
        <CarouselContent>
          {colors.map((color, index) => (
            <CarouselItem key={index}>
              <div
                style={{
                  backgroundColor: color,
                  borderRadius: 8,
                  height: orientation === "vertical" ? 150 : 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: index > 2 ? "#fff" : "#334155",
                }}
              >
                Slide {index + 1}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
}
