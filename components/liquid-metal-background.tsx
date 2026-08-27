"use client"
import { useEffect, useState } from "react"
import { LiquidMetal } from "@paper-design/shaders-react"

export function LiquidMetalBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="absolute inset-0 z-0 bg-[#00042e]" />
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full max-w-[100vw] overflow-hidden">
      <LiquidMetal
        width="100%"
        height="100%"
        colorBack="#00042e"
        colorTint="#5b4dc7"
        repetition={4}
        softness={0.45}
        shiftRed={-0.5}
        shiftBlue={-1}
        distortion={0.1}
        contour={1}
        shape="none"
        speed={0.4}
        scale={2.2}
      />
    </div>
  )
}
