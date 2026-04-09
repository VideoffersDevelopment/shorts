import { ImageResponse } from "next/og"

export const runtime = "edge"

export const size = {
  width: 32,
  height: 32
}

export const contentType = "image/png"

export default function Icon() {
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
          borderRadius: "6px"
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="white"
          style={{ marginLeft: "2px" }}
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
