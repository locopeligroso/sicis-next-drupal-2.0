'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          backgroundColor: '#f5f5f5',
          color: '#111',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '2rem' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: '0.9rem',
              color: '#555',
              marginBottom: '1.5rem',
            }}
          >
            {error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.6rem 1.4rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: '1px solid #111',
              backgroundColor: '#111',
              color: '#fff',
              borderRadius: 4,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
