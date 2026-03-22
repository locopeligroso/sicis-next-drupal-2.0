import { notFound } from 'next/navigation';
import { InteractiveGrid } from './interactive-grid';

if (process.env.NODE_ENV !== 'development') notFound();

const COLORS = [
  '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
  '#264653', '#a8dadc', '#d62828', '#6a994e', '#bc6c25',
];

export default function ScrollSnapDemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-[family-name:var(--font-body)]">
      <h1 className="text-3xl font-bold mb-2 font-[family-name:var(--font-heading)]">
        CSS Scroll Snap Demo
      </h1>

      {/* --- 1. HORIZONTAL MANDATORY + START --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-1">
          1. Horizontal — <code className="text-sm bg-muted px-1.5 py-0.5 rounded">mandatory</code> + <code className="text-sm bg-muted px-1.5 py-0.5 rounded">start</code>
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Snap sempre forzato al bordo sinistro di ogni slide.
        </p>
        <div
          className="flex overflow-x-scroll snap-x snap-mandatory gap-4 pb-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {COLORS.map((color, i) => (
            <div
              key={i}
              className="snap-start shrink-0 w-[300px] h-[200px] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: color }}
            >
              Slide {i + 1}
            </div>
          ))}
        </div>
      </section>

      {/* --- 2. HORIZONTAL CENTER --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-1">
          2. Horizontal — <code className="text-sm bg-muted px-1.5 py-0.5 rounded">mandatory</code> + <code className="text-sm bg-muted px-1.5 py-0.5 rounded">center</code>
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Ogni slide si centra nel viewport.
        </p>
        <div
          className="flex overflow-x-scroll snap-x snap-mandatory gap-4 pb-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {COLORS.map((color, i) => (
            <div
              key={i}
              className="snap-center shrink-0 w-[250px] h-[200px] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: color }}
            >
              Slide {i + 1}
            </div>
          ))}
        </div>
      </section>

      {/* --- 3. HORIZONTAL PROXIMITY --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-1">
          3. Horizontal — <code className="text-sm bg-muted px-1.5 py-0.5 rounded">proximity</code>
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Snap solo se sei vicino a un punto. Prova uno swipe lungo vs uno corto.
        </p>
        <div
          className="flex overflow-x-scroll snap-x snap-proximity gap-4 pb-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {COLORS.map((color, i) => (
            <div
              key={i}
              className="snap-start shrink-0 w-[300px] h-[200px] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: color }}
            >
              Slide {i + 1}
            </div>
          ))}
        </div>
      </section>

      {/* --- 4. SCROLL-PADDING (GUTTER) --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-1">
          4. <code className="text-sm bg-muted px-1.5 py-0.5 rounded">scroll-padding</code> (gutter sul container)
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Le slide si agganciano con un offset di 40px dal bordo — stile Apple. Il padding è sul <strong>container</strong>.
        </p>
        <div
          className="flex overflow-x-scroll snap-x snap-mandatory pb-4 -mx-8"
          style={{ scrollbarWidth: 'none', scrollPadding: '0 40px' }}
        >
          <div className="flex gap-4 px-10 min-w-fit">
            {COLORS.map((color, i) => (
              <div
                key={i}
                className="snap-start shrink-0 w-[300px] h-[200px] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                style={{ backgroundColor: color }}
              >
                Slide {i + 1}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 5. SCROLL-MARGIN (OFFSET PER SLIDE) --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-1">
          5. <code className="text-sm bg-muted px-1.5 py-0.5 rounded">scroll-margin</code> (offset per slide)
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Come scroll-padding ma applicato sulle <strong>slide</strong>. La slide 1 ha 0px, le altre hanno 40px di margine sinistro.
          A differenza di scroll-padding, puoi differenziare per singola slide.
        </p>
        <div
          className="flex overflow-x-scroll snap-x snap-mandatory gap-4 pb-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {COLORS.map((color, i) => (
            <div
              key={i}
              className="snap-start shrink-0 w-[300px] h-[200px] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: color, scrollMarginLeft: i === 0 ? 0 : 40 }}
            >
              Slide {i + 1}{i > 0 && <span className="text-sm ml-2 opacity-75">(+40px)</span>}
            </div>
          ))}
        </div>
      </section>

      {/* --- 6. VERTICAL --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-1">
          6. Vertical — <code className="text-sm bg-muted px-1.5 py-0.5 rounded">snap-y mandatory</code>
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Scroll verticale con snap. Funziona uguale, asse diverso.
        </p>
        <div
          className="overflow-y-scroll snap-y snap-mandatory h-[300px] rounded-xl border"
          style={{ scrollbarWidth: 'none' }}
        >
          {COLORS.map((color, i) => (
            <div
              key={i}
              className="snap-start shrink-0 h-[300px] flex items-center justify-center text-white text-3xl font-bold"
              style={{ backgroundColor: color }}
            >
              Section {i + 1}
            </div>
          ))}
        </div>
      </section>

      {/* --- 7. SCROLL-SNAP-STOP --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-1">
          7. <code className="text-sm bg-muted px-1.5 py-0.5 rounded">scroll-snap-stop: always</code>
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Non puoi saltare slide con uno swipe veloce — si ferma ad ogni singola slide.
        </p>
        <div
          className="flex overflow-x-scroll snap-x snap-mandatory gap-4 pb-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {COLORS.map((color, i) => (
            <div
              key={i}
              className="snap-start snap-always shrink-0 w-[80vw] h-[200px] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: color }}
            >
              Slide {i + 1}
            </div>
          ))}
        </div>
      </section>

      {/* --- 8. BOTH MANDATORY (GRIGLIA 2D) --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-1">
          8. <code className="text-sm bg-muted px-1.5 py-0.5 rounded">both mandatory</code> (griglia 2D)
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Snap su entrambi gli assi. Scrolla in orizzontale E verticale — ogni cella si aggancia.
        </p>
        <div
          className="overflow-scroll snap-both snap-mandatory h-[300px] w-full rounded-xl border"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="grid grid-cols-[repeat(5,300px)] grid-rows-[repeat(4,300px)]">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="snap-start flex items-center justify-center text-white text-2xl font-bold border border-white/20"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              >
                {Math.floor(i / 5) + 1},{(i % 5) + 1}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 9. OVERSCROLL-BEHAVIOR --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-1">
          9. <code className="text-sm bg-muted px-1.5 py-0.5 rounded">overscroll-behavior: contain</code>
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Quando arrivi alla fine del carousel, lo scroll NON si propaga alla pagina.
          Confronta con la sezione 1 dove invece la pagina scrolla.
        </p>
        <div
          className="flex overflow-x-scroll snap-x snap-mandatory gap-4 pb-4"
          style={{ scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}
        >
          {COLORS.map((color, i) => (
            <div
              key={i}
              className="snap-start shrink-0 w-[300px] h-[200px] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: color }}
            >
              Slide {i + 1}
            </div>
          ))}
        </div>
      </section>

      {/* --- 10. DUAL ALIGN VALUES --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-1">
          10. <code className="text-sm bg-muted px-1.5 py-0.5 rounded">scroll-snap-align</code> a due valori
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Puoi dare allineamenti diversi per block (Y) e inline (X).
          Qui: <code className="text-sm bg-muted px-1.5 py-0.5 rounded">start center</code> — block=start, inline=center.
          Scrolla in entrambe le direzioni.
        </p>
        <div
          className="overflow-scroll snap-both snap-mandatory h-[300px] w-full rounded-xl border"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="grid grid-cols-[repeat(5,80vw)] grid-rows-[repeat(3,300px)]">
            {Array.from({ length: 15 }, (_, i) => (
              <div
                key={i}
                className="flex items-center justify-center text-white text-2xl font-bold border border-white/20"
                style={{
                  backgroundColor: COLORS[i % COLORS.length],
                  scrollSnapAlign: 'start center',
                }}
              >
                row {Math.floor(i / 5) + 1}, col {(i % 5) + 1}
                <span className="text-sm ml-2 opacity-75">(start center)</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 11. INTERACTIVE GRID (MDN STYLE) --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-1">
          11. Griglia interattiva (stile MDN)
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Griglia 2D con controlli live: cambia align (start/center/end) per block e inline,
          attiva snap-stop, o disabilita lo snap del tutto. Il riquadro in basso mostra i valori CSS correnti.
        </p>
        <InteractiveGrid />
      </section>
    </div>
  );
}
