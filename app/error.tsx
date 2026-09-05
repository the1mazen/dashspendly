"use client"

import { useEffect } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error)
  }, [error])

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0a0518] text-white">
      <div className="w-full max-w-md p-6 rounded-3xl border border-white/10 bg-[#160728]/90 backdrop-blur-2xl shadow-2xl text-center space-y-4">
        <div className="size-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <AlertCircle className="size-6" />
        </div>
        <h2 className="text-lg font-bold font-display text-white">Something went wrong</h2>
        <p className="text-xs text-white/60 font-sans">
          {error?.message || "A temporary network or display error occurred. Please reload to resume your session."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white cursor-pointer transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#A7F3D0] text-[#120824] hover:bg-[#86efac] cursor-pointer transition-colors flex items-center gap-1.5 shadow-lg"
          >
            <RotateCcw className="size-3.5" />
            Reload Page
          </button>
        </div>
      </div>
    </div>
  )
}
