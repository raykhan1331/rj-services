import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#fff",
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "#000",
            border: "3px solid #fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
            fontWeight: 700,
            fontFamily: "Georgia, serif",
          }}
        >
          RJ
        </div>
        <div style={{ marginTop: 32, fontSize: 64, fontWeight: 700, fontFamily: "Georgia, serif" }}>
          RJ Services
        </div>
        <div style={{ marginTop: 16, fontSize: 28, color: "#a1a1aa" }}>
          UK Company Formation, Banking &amp; Business Setup
        </div>
      </div>
    ),
    { ...size }
  );
}
