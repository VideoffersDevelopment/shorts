import { ImageResponse } from "next/og"

export const runtime = "edge"

export const size = {
  width: 180,
  height: 180
}

export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "32px"
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="white"
          style={{ marginLeft: "8px" }}
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    ),
    {
      ...size
    }
  )
}
