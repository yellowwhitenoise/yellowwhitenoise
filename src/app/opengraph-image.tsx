import { ImageResponse } from "next/og";

export const alt =
  "Yellow White Noise — Independent Amapiano & Afrobeats Label";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#14120d",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              color: "#f0b429",
              letterSpacing: 28,
              marginLeft: 28,
            }}
          >
            YELLOW
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              color: "#f5f1e8",
              letterSpacing: 28,
              marginLeft: 28,
            }}
          >
            WHITE
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              color: "#f5f1e8",
              letterSpacing: 28,
              marginLeft: 28,
            }}
          >
            NOISE
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 24,
            letterSpacing: 10,
            color: "rgba(245,241,232,0.55)",
          }}
        >
          INDEPENDENT AMAPIANO AND AFROBEATS LABEL
        </div>
      </div>
    ),
    size,
  );
}
