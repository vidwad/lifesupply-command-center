"use client";

/**
 * Root error boundary (Phase 11E — row 11E-06). Catches render/runtime
 * errors that escape every route so users get a recoverable page instead
 * of a blank screen. The server half of the same failure is reported by
 * `onRequestError` in src/instrumentation.ts; this boundary only needs to
 * offer a way back.
 */
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
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
            The error has been logged on the server.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
