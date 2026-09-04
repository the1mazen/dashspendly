"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from "react"

interface LandingVideoContextType {
  isVideoEnabled: boolean
  toggleVideo: () => void
  setIsVideoEnabled: (enabled: boolean) => void
}

const LandingVideoContext = createContext<LandingVideoContextType>({
  isVideoEnabled: true,
  toggleVideo: () => {},
  setIsVideoEnabled: () => {},
})

export function useLandingVideo() {
  return useContext(LandingVideoContext)
}

export function LandingVideoProvider({ children }: { children: React.ReactNode }) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("spendly_landing_video_enabled")
      if (saved !== null) {
        setIsVideoEnabled(saved === "true")
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const toggleVideo = () => {
    setIsVideoEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem("spendly_landing_video_enabled", String(next))
      } catch {
        // Ignore
      }
      return next
    })
  }

  return (
    <LandingVideoContext.Provider value={{ isVideoEnabled, toggleVideo, setIsVideoEnabled }}>
      {children}
    </LandingVideoContext.Provider>
  )
}

export function LandingBackground() {
  const { isVideoEnabled } = useLandingVideo()
  const [isDesktop, setIsDesktop] = useState(true)
  const [videoAwake, setVideoAwake] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mediaQuery.matches)

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches)
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange)
    } else {
      mediaQuery.addListener(handleMediaChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange)
      } else {
        mediaQuery.removeListener(handleMediaChange)
      }
    }
  }, [])

  const staticImage = isDesktop
    ? "/landing/desktop-bg.jpeg"
    : "/landing/mobile-bg.jpeg"

  const animatedVideo = isDesktop
    ? "/landing/desktop-bg.mp4"
    : "/landing/mobile-bg.mp4"

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVideoAwake(false)

    if (isVideoEnabled) {
      timerRef.current = setTimeout(() => {
        setVideoAwake(true)
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isVideoEnabled, isDesktop])

  const handleVideoCanPlay = () => {
    if (isVideoEnabled) {
      setVideoAwake(true)
      if (videoRef.current) {
        videoRef.current.play().catch(() => {})
      }
    }
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#00042e]"
    >
      {/* Static Background Image (Desktop or Mobile) */}
      <img
        src={staticImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      />

      {/* Animated Video Background (Desktop or Mobile) */}
      {isVideoEnabled && (
        <video
          ref={videoRef}
          key={animatedVideo}
          src={animatedVideo}
          poster={staticImage}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          onCanPlay={handleVideoCanPlay}
          onLoadedData={handleVideoCanPlay}
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          style={{
            opacity: videoAwake ? 1 : 0,
            transition: "opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  )
}

export const LiquidMetalBackground = LandingBackground
