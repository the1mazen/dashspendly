"use client"
import Link from "next/link"
import { Film, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLandingVideo } from "@/components/landing-background"

export function FloatingNavbar() {
  const { isVideoEnabled, toggleVideo } = useLandingVideo()

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" })
    }
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-2 py-3 sm:px-4 sm:py-4">
      <div className="mx-auto w-full max-w-7xl rounded-2xl border-2 border-white/20 bg-white/10 px-3 py-3 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.3)] sm:px-6 sm:py-4 transition-all"
        style={{
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%)",
        }}
      >
        <div className="flex min-w-0 items-center justify-between gap-3">
          {/* Logo */}
          <button onClick={() => scrollToSection("home")} className="cursor-pointer flex items-center">
            <img
              src="/LOGO.png"
              alt="Spendly"
              className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
            />
          </button>

          {/* Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => scrollToSection("home")}
              className="text-sm font-open-sans-custom text-gray-200 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)] cursor-pointer"
            >
              Welcome
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-open-sans-custom text-gray-200 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)] cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-sm font-open-sans-custom text-gray-200 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)] cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-sm font-open-sans-custom text-gray-200 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)] cursor-pointer"
            >
              Contact
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVideo}
              className="rounded-xl p-2 text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-white/10 flex items-center justify-center group"
              aria-label={isVideoEnabled ? "Stop Video" : "Play Video"}
              title={isVideoEnabled ? "Stop Video" : "Play Video"}
            >
              {isVideoEnabled ? (
                <Film className="size-4 text-[#A7F3D0]" />
              ) : (
                <VideoOff className="size-4 text-white/50" />
              )}
            </button>

            {/* CTA Button */}
            <Button
              asChild
              size="sm"
              className="shrink-0 bg-white px-3 text-xs text-black hover:bg-gray-100 [text-shadow:_0_1px_2px_rgb(0_0_0_/_10%)] font-open-sans-custom sm:px-4 sm:text-sm"
            >
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
