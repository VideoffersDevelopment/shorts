"use client"

import { useCallback, useRef, useState } from "react"
import { Play, Pause, RotateCcw, Volume2, VolumeX, AlertTriangle } from "lucide-react"
import { useTranslations } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VideoPreviewProps {
  src: string
  duration: number
  aspectRatio: string
  onChangeVideo?: () => void
  className?: string
}

export function VideoPreview({
  src,
  duration,
  aspectRatio,
  onChangeVideo,
  className
}: VideoPreviewProps) {
  const { t } = useTranslations("shorts")
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleMuteToggle = useCallback(() => {
    if (!videoRef.current) return

    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleRestart = useCallback(() => {
    if (!videoRef.current) return

    videoRef.current.currentTime = 0
    videoRef.current.play()
    setIsPlaying(true)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return

    const time = parseFloat(e.target.value)
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }, [])

  // Calculate aspect ratio for container
  const getContainerStyle = useCallback(() => {
    // Parse aspect ratio (e.g., "1080:1920" -> 1080/1920)
    const [width, height] = aspectRatio.split(":").map(Number)
    if (width && height) {
      const ratio = width / height
      // For vertical videos (shorts), constrain height
      if (ratio < 1) {
        return { maxHeight: "400px" }
      }
    }
    return {}
  }, [aspectRatio])

  // Check if aspect ratio is optimal (9:16)
  const isOptimalAspectRatio = useCallback(() => {
    const [width, height] = aspectRatio.split(":").map(Number)
    if (width && height) {
      // Check for 9:16 ratio (with tolerance for slight variations)
      const ratio = width / height
      const targetRatio = 9 / 16
      return Math.abs(ratio - targetRatio) < 0.05
    }
    return false
  }, [aspectRatio])

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative rounded-lg overflow-hidden bg-black" style={getContainerStyle()}>
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain"
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onClick={handlePlayPause}
        />

        {/* Play overlay when paused */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={handlePlayPause}
          >
            <div className="rounded-full bg-white/90 p-4">
              <Play className="h-8 w-8 text-black fill-black" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-2">
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
          />
          <span className="text-xs text-muted-foreground w-10 text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRestart}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleMuteToggle}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          {onChangeVideo && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onChangeVideo}
            >
              {t("wizard.video.changeVideo")}
            </Button>
          )}
        </div>
      </div>

      {/* Aspect ratio warning */}
      {!isOptimalAspectRatio() && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-sm">{t("wizard.video.aspectWarning")}</p>
        </div>
      )}
    </div>
  )
}
