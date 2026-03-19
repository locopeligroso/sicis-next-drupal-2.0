import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxGroup,
  ComboboxLabel,
} from "@/components/ui/combobox"

const meta = {
  title: "Primitives/Combobox",
  component: Combobox,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const frameworks = [
  { value: "next.js", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt", label: "Nuxt" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
]

const libraries = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
  { value: "solid", label: "Solid" },
]

export const Playground: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "2rem 0",
      }}
    >
      <Combobox>
        <ComboboxInput placeholder="Search framework..." />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty>No results found.</ComboboxEmpty>
            <ComboboxGroup>
              <ComboboxLabel>Frameworks</ComboboxLabel>
              {frameworks.map((framework) => (
                <ComboboxItem key={framework.value} value={framework.value}>
                  {framework.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
            <ComboboxGroup>
              <ComboboxLabel>Libraries</ComboboxLabel>
              {libraries.map((library) => (
                <ComboboxItem key={library.value} value={library.value}>
                  {library.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  ),
}
