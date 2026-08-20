import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * Branded 1200x630 sharing card, used as the og:image fallback for any
 * page that has no photograph of its own (and for the whole site until
 * real photographs are published).
 */
export async function GET() {
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
          backgroundColor: "#faf8f4",
          border: "24px solid #f3efe7",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 64,
            letterSpacing: "0.12em",
            color: "#1d1b18",
            display: "flex",
          }}
        >
          COURTNEY STOCKTON
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 26,
            letterSpacing: "0.45em",
            color: "#78695a",
            display: "flex",
          }}
        >
          PHOTOGRAPHY
        </div>
        <div
          style={{
            marginTop: 46,
            width: 90,
            height: 2,
            backgroundColor: "#d8cfc0",
            display: "flex",
          }}
        />
        <div
          style={{
            marginTop: 46,
            fontSize: 28,
            fontStyle: "italic",
            color: "#6e6459",
            display: "flex",
          }}
        >
          Sonoma · Napa · Northern California
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
