"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function FloatingNavbar() {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" })
    }
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-2 py-3 sm:px-4 sm:py-4">
      <div className="mx-auto w-full max-w-7xl rounded-2xl border-2 border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          {/* Logo */}
          <button onClick={() => scrollToSection("home")} className="cursor-pointer">
            <span className="shrink-0 font-open-sans-custom text-lg font-semibold sm:text-xl tracking-tight text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_40%)]">
              Spendly
            </span>
          </button>

          {/* Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)] cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)] cursor-pointer"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)] cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)] cursor-pointer"
            >
              Contact
            </button>
          </div>

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
    </nav>
  )
}
