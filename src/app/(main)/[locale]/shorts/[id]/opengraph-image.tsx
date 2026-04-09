import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const alt = "Short Video"
export const size = {
  width: 1200,
  height: 630
}
export const contentType = "image/png"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OpenGraphImage({ params }: Props) {
  const resolvedParams = await params
  const short = await prisma.short.findUnique({
    where: { id: resolvedParams.id },
    select: {
      title: true,
      thumbnailUrl: true,
      company: {
        select: {
          companyName: true,
          logo: true
        }
      }
    }
  })

  if (!short) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white"
          }}
        >
          Short Not Found
        </div>
      ),
      { ...size }
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}
      >
        {/* Background thumbnail */}
        {short.thumbnailUrl && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.3
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={short.thumbnailUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          </div>
        )}

        {/* Content overlay */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "48px",
            position: "relative",
            zIndex: 1
          }}
        >
          {/* Company logo */}
          {short.company.logo && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: 40,
                overflow: "hidden",
                marginBottom: 24,
                background: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={short.company.logo}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
            </div>
          )}

          {/* Title */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "white",
              lineHeight: 1.2,
              maxWidth: "80%",
              marginBottom: 16,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)"
            }}
          >
            {short.title}
          </div>

          {/* Company name */}
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            by {short.company.companyName}
          </div>
        </div>

        {/* VideoShorts branding */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 32,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "white"
            }}
          >
            VideoShorts
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
