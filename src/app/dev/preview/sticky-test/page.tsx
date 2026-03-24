export default function StickyTestPage() {
  if (process.env.NODE_ENV !== "development") return null

  return (
    <>
      {/* Test A: bare flex — does sticky work? */}
      <section>
        <h2 style={{ padding: 16, background: "#333", color: "#fff", position: "sticky", top: 0, zIndex: 20 }}>
          Scroll down — check each test
        </h2>
      </section>

      {/* Test B: mimic real layout structure */}
      {/* outer main with pt-[92px] like the real layout */}
      <main style={{ paddingTop: 92, minHeight: "60vh" }}>
        {/* flex container like ProductListingTemplate */}
        <div style={{ display: "flex" }}>
          {/* aside (no items-start = stretch) */}
          <aside style={{ width: 250, flexShrink: 0, background: "#f0f0f0", borderRight: "1px solid #ccc" }}>
            <div
              style={{
                position: "sticky",
                top: 92,
                minHeight: "calc(100vh - 92px)",
                padding: 16,
                background: "#e0e0e0",
              }}
            >
              <p><strong>TEST B: sticky inside aside (stretch)</strong></p>
              <p>I should stick at top=92px</p>
            </div>
          </aside>

          {/* main content */}
          <div style={{ flex: 1, padding: 16 }}>
            {Array.from({ length: 80 }, (_, i) => (
              <p key={i} style={{ padding: "20px 0", borderBottom: "1px solid #eee" }}>
                Product row {i + 1}
              </p>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
