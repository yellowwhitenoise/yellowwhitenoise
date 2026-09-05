"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14120d",
          color: "#f5f1e8",
          fontFamily: "Helvetica, Arial, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div>
          <p style={{ fontSize: 11, letterSpacing: 3, opacity: 0.5 }}>
            YELLOW WHITE NOISE
          </p>
          <h1 style={{ fontSize: 22, margin: "12px 0" }}>
            Something went wrong.
          </h1>
          <button
            type="button"
            onClick={reset}
            style={{
              cursor: "pointer",
              borderRadius: 999,
              border: "1px solid rgba(245,241,232,0.25)",
              background: "transparent",
              color: "#f5f1e8",
              padding: "10px 24px",
              fontSize: 11,
              letterSpacing: 2,
            }}
          >
            TRY AGAIN
          </button>
        </div>
      </body>
    </html>
  );
}
