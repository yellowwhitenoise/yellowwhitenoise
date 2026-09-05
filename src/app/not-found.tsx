import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        margin: "0 auto",
        minHeight: "100dvh",
        maxWidth: 480,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 11, letterSpacing: 3, opacity: 0.5 }}>
        YELLOW WHITE NOISE
      </p>
      <h1 style={{ fontSize: 24, margin: "12px 0" }}>Nothing here.</h1>
      <p style={{ fontSize: 13, opacity: 0.6 }}>
        This page doesn&apos;t exist or is no longer published.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 20,
          borderRadius: 999,
          border: "1px solid rgba(245,241,232,0.25)",
          padding: "10px 24px",
          fontSize: 11,
          letterSpacing: 2,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        BACK HOME
      </Link>
    </main>
  );
}
