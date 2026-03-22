import { notFound } from 'next/navigation';

if (process.env.NODE_ENV !== 'development') notFound();

const SLIDES = [
  { title: 'Low-light photography and Night mode.', desc: 'Capture sharp, detailed, bright images with natural colors, even when it\'s dark.', color: '#1a1a2e', width: '70vw' },
  { title: 'All 48MP rear cameras.', desc: 'Pro Fusion cameras capture more detailed images at every zoom range and light level.', color: '#2d1b2e', width: '45vw' },
  { title: 'Ultra Wide camera.', desc: 'Capture powerful perspectives with mesmerizing macro photos and dramatic wide-angle shots.', color: '#1b2e1b', width: '55vw' },
  { title: 'Latest-generation Photographic Styles.', desc: 'Choose from different preset styles to customize the tone, color, and look of your photos.', color: '#2e2b1b', width: '35vw' },
  { title: 'Clean Up.', desc: 'Remove unwanted objects, people, and background distractions from your photos.', color: '#1b2a2e', width: '60vw' },
];

export default function AppleCarouselPage() {
  return (
    <div className="min-h-screen bg-black text-white font-[family-name:var(--font-body)]">
      <style>{`
        :root {
          --gutter: max(24px, calc((100vw - 1280px) / 2));
        }

        /* Section */
        .apple-section {
          padding: 80px 0 120px;
        }

        .apple-section h2 {
          font-family: var(--font-heading);
          font-size: clamp(2rem, 5vw, 4rem);
          font-weight: 700;
          text-align: center;
          margin-bottom: 60px;
          padding: 0 var(--gutter);
        }

        /* Carousel wrapper — no overflow on this, it's the positioning context */
        .carousel-wrapper {
          position: relative;
        }

        /* Scroll container — full width, bleeds to edges */
        .carousel-scroller {
          display: flex;
          overflow-x: scroll;
          scroll-snap-type: x mandatory;
          scroll-padding: 0 var(--gutter);
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .carousel-scroller::-webkit-scrollbar {
          display: none;
        }

        /* Inner track — padding creates the gutter, min-width ensures it doesn't shrink */
        .carousel-track {
          display: flex;
          align-items: stretch;
          gap: 16px;
          padding: 0 var(--gutter);
          min-width: fit-content;
          border-left: 3px dashed rgba(255,100,100,0.8);
        }

        /* Debug: show gutter area */
        .carousel-scroller {
          background: linear-gradient(to right, rgba(255,100,100,0.15) var(--gutter), transparent var(--gutter));
        }

        /* Slides */
        .carousel-slide {
          scroll-snap-align: start;
          flex-shrink: 0;
          min-width: 280px;
          height: 600px;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .carousel-slide:last-child {
          scroll-snap-align: start end;
        }

        /* Slide image area */
        .slide-image {
          width: 100%;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: rgba(255,255,255,0.3);
        }

        /* Slide caption */
        .slide-caption {
          padding: 24px 28px 28px;
        }
        .slide-caption h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .slide-caption p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.6);
          line-height: 1.5;
        }

        /* Arrow buttons */
        .carousel-arrows {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 32px;
        }
        .carousel-arrow {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.12);
          color: white;
          font-size: 1.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .carousel-arrow:hover {
          background: rgba(255,255,255,0.25);
        }
        .carousel-arrow:disabled {
          opacity: 0.3;
          cursor: default;
        }
      `}</style>

      <section className="apple-section">
        <h2>Pro results down to the pixel.</h2>

        <div className="carousel-wrapper">
          <div className="carousel-scroller" id="scroller">
            <div className="carousel-track">
              {SLIDES.map((slide, i) => (
                <div key={i} className="carousel-slide" style={{ width: slide.width }}>
                  <div className="slide-image" style={{ backgroundColor: slide.color }}>
                    {slide.title.split('.')[0]}
                  </div>
                  <div className="slide-caption">
                    <h3>{slide.title}</h3>
                    <p>{slide.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="carousel-arrows">
            <button className="carousel-arrow" id="prev" aria-label="Previous">&#8592;</button>
            <button className="carousel-arrow" id="next" aria-label="Next">&#8594;</button>
          </div>
        </div>
      </section>

      <script dangerouslySetInnerHTML={{ __html: `
        const scroller = document.getElementById('scroller');
        const prev = document.getElementById('prev');
        const next = document.getElementById('next');

        function getSlideWidth() {
          const slide = scroller.querySelector('.carousel-slide');
          return slide.offsetWidth + 16; // width + gap
        }

        function updateArrows() {
          const maxScroll = scroller.scrollWidth - scroller.clientWidth;
          prev.disabled = scroller.scrollLeft <= 2;
          next.disabled = scroller.scrollLeft >= maxScroll - 2;
        }

        prev.addEventListener('click', () => {
          scroller.scrollBy({ left: -getSlideWidth(), behavior: 'smooth' });
        });

        next.addEventListener('click', () => {
          scroller.scrollBy({ left: getSlideWidth(), behavior: 'smooth' });
        });

        scroller.addEventListener('scroll', updateArrows, { passive: true });
        updateArrows();
      `}} />
    </div>
  );
}
