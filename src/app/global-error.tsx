"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#09090b",
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#111114",
              border: "1px solid #27272e",
              borderRadius: "16px",
              maxWidth: "420px",
              width: "100%",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "1rem",
              }}
            >
              ⚠
            </div>

            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#fff",
                marginBottom: "0.5rem",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#a1a1aa",
                marginBottom: "1.5rem",
              }}
            >
              A critical error occurred. Please try again.
            </p>

            {error.digest && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#52525b",
                  marginBottom: "1.5rem",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}

            <button
              onClick={reset}
              style={{
                width: "100%",
                padding: "0.625rem",
                borderRadius: "8px",
                fontWeight: 500,
                fontSize: "0.875rem",
                color: "#fff",
                background: "#f97316",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
