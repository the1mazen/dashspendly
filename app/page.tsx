"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { LandingBackground, LandingVideoProvider } from "@/components/landing-background"
import { FloatingNavbar } from "@/components/floating-navbar"
import { Feature } from "@/components/ui/feature-with-advantages"
import { WhySpendly } from "@/components/ui/why-spendly"
import { ContactCard } from "@/components/ui/contact-card"
import { AboutQuote } from "@/components/ui/about-quote"
import { cn } from "@/lib/utils"

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const featuresSectionRef = useRef<HTMLDivElement>(null)
  const aboutSectionRef = useRef<HTMLDivElement>(null)
  const contactSectionRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef({ x: 0, y: 0 })

  const moveToSection = (direction: 1 | -1) => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return
    const currentSection = Math.round(scrollContainer.scrollLeft / scrollContainer.offsetWidth)
    const targetSection = Math.max(0, Math.min(currentSection + direction, 3))
    scrollContainer.scrollTo({ left: targetSection * scrollContainer.offsetWidth, behavior: "smooth" })
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const primaryDistance = Math.max(Math.abs(deltaX), Math.abs(deltaY))

    if (primaryDistance < 48) return

    if (Math.abs(deltaY) >= Math.abs(deltaX)) {
      moveToSection(deltaY < 0 ? 1 : -1)
      return
    }

    moveToSection(deltaX < 0 ? 1 : -1)
  }

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleWheel = (e: WheelEvent) => {
      const delta = e.deltaY
      const currentScroll = scrollContainer.scrollLeft
      const containerWidth = scrollContainer.offsetWidth
      const currentSection = Math.round(currentScroll / containerWidth)

      if (currentSection === 1 && featuresSectionRef.current) {
        const featuresSection = featuresSectionRef.current
        const isAtTop = featuresSection.scrollTop === 0
        const isAtBottom = featuresSection.scrollTop + featuresSection.clientHeight >= featuresSection.scrollHeight - 1

        if (delta > 0 && !isAtBottom) {
          return
        }

        if (delta < 0 && !isAtTop) {
          return
        }

        if (delta < 0 && isAtTop) {
          e.preventDefault()
          scrollContainer.scrollTo({
            left: 0 * containerWidth,
            behavior: "smooth",
          })
          return
        }

        if (delta > 0 && isAtBottom) {
          e.preventDefault()
          scrollContainer.scrollTo({
            left: 2 * containerWidth,
            behavior: "smooth",
          })
          return
        }
      }

      if (currentSection === 2 && aboutSectionRef.current) {
        const aboutSection = aboutSectionRef.current
        const isAtTop = aboutSection.scrollTop === 0
        const isAtBottom = aboutSection.scrollTop + aboutSection.clientHeight >= aboutSection.scrollHeight - 1

        if (delta > 0 && !isAtBottom) {
          return
        }

        if (delta < 0 && !isAtTop) {
          return
        }

        if (delta < 0 && isAtTop) {
          e.preventDefault()
          scrollContainer.scrollTo({
            left: 1 * containerWidth,
            behavior: "smooth",
          })
          return
        }

        if (delta > 0 && isAtBottom) {
          e.preventDefault()
          scrollContainer.scrollTo({
            left: 3 * containerWidth,
            behavior: "smooth",
          })
          return
        }
      }

      if (currentSection === 3 && contactSectionRef.current) {
        const contactSection = contactSectionRef.current
        const isAtTop = contactSection.scrollTop === 0
        const isAtBottom = contactSection.scrollTop + contactSection.clientHeight >= contactSection.scrollHeight - 1

        if (delta > 0 && !isAtBottom) {
          return
        }

        if (delta < 0 && !isAtTop) {
          return
        }

        if (delta < 0 && isAtTop) {
          e.preventDefault()
          scrollContainer.scrollTo({
            left: 2 * containerWidth,
            behavior: "smooth",
          })
          return
        }

        if (delta > 0 && isAtBottom) {
          e.preventDefault()
          return
        }
      }

      e.preventDefault()

      if (Math.abs(delta) > 10) {
        let targetSection = currentSection
        if (delta > 0) {
          targetSection = Math.min(currentSection + 1, 3)
        } else {
          targetSection = Math.max(currentSection - 1, 0)
        }

        scrollContainer.scrollTo({
          left: targetSection * containerWidth,
          behavior: "smooth",
        })
      }
    }

    scrollContainer.addEventListener("wheel", handleWheel, { passive: false })
    return () => scrollContainer.removeEventListener("wheel", handleWheel)
  }, [])

  return (
    <LandingVideoProvider>
      <main className="relative h-[100dvh] min-h-[100svh] w-full overflow-hidden bg-[#00042e]">
        <LandingBackground />

        <div className="pointer-events-none fixed inset-0 z-[5] bg-black/15" />

        <FloatingNavbar />

        <div
          ref={scrollContainerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative z-10 flex h-[100dvh] w-full max-w-full overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory overscroll-x-contain touch-pan-y"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* PAGE 1 — Welcome (Hero) */}
          <section id="home" className="flex w-full min-w-full max-w-full shrink-0 snap-start items-center justify-center px-4 py-24 sm:px-6">
            <div className="mx-auto max-w-4xl">
              <div className="text-center px-0 leading-5">
                <h1 className="mb-6 text-balance text-[clamp(2rem,9vw,3.5rem)] leading-[1] tracking-tight text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)] md:text-6xl lg:text-8xl">
                  <span className="font-open-sans-custom not-italic">Track.</span>{" "}
                  <span className="font-serif italic">Understand.</span>{" "}
                  <span className="font-open-sans-custom not-italic">Save.</span>
                </h1>

                <p className="mb-8 mx-auto max-w-2xl text-pretty leading-relaxed text-gray-300 [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)] font-thin font-open-sans-custom tracking-wide text-base leading-6 sm:text-lg sm:leading-7">
                  Your money, finally making sense. Spendly gives you a clear, clutter-free view of where every dollar goes — no subscriptions, no nonsense.
                </p>
              </div>
            </div>
          </section>

          {/* PAGE 2 — Features & Why Spendly Stats & Pillars (Merged) */}
          <section
            id="features"
            ref={featuresSectionRef}
            className="horizontal-panel relative w-full min-w-full max-w-full shrink-0 snap-start overflow-y-auto px-4 pt-24 pb-28 sm:px-6 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 z-0 size-full pointer-events-none",
                "bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)]",
                "bg-[size:12px_12px]",
                "opacity-30",
              )}
            />

            <div className="relative z-10 mx-auto max-w-7xl w-full space-y-16 sm:space-y-24">
              <Feature />
              <WhySpendly />
            </div>
          </section>

          {/* PAGE 5 — About Spendly */}
          <section
            id="about"
            ref={aboutSectionRef}
            className="horizontal-panel relative w-full min-w-full max-w-full shrink-0 snap-start overflow-y-auto px-4 pt-24 pb-28 sm:px-6 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 z-0 size-full pointer-events-none",
                "bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)]",
                "bg-[size:12px_12px]",
                "opacity-30",
              )}
            />

            <div className="relative z-10 mx-auto w-full max-w-7xl">
              <AboutQuote />
            </div>
          </section>

          {/* PAGE 6 — Contact */}
          <section
            id="contact"
            ref={contactSectionRef}
            className="horizontal-panel relative w-full min-w-full max-w-full shrink-0 snap-start overflow-y-auto px-4 pt-24 pb-28 sm:px-6"
          >
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 z-0 size-full pointer-events-none",
                "bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)]",
                "bg-[size:12px_12px]",
                "opacity-30",
              )}
            />

            <div className="relative z-10 mx-auto w-full max-w-5xl mt-[5vh]">
              <ContactCard
                title="Get in touch"
                description="Feel free to reach out directly through email or GitHub."
                contactInfo={[]}
              >
                <div className="w-full flex flex-col justify-center space-y-4 py-2">
                  <p className="text-xs sm:text-sm text-gray-300 font-open-sans-custom [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]">
                    Have a question or want to collaborate? I respond within a day.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-3.5 w-full">
                    {/* BUTTON 1 — Gmail */}
                    <a
                      href="mailto:reachmazen@gmail.com"
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-[50px] bg-white px-[28px] py-[14px] text-[0.9rem] font-semibold text-black font-open-sans-custom transition-transform duration-200 hover:-translate-y-[2px] active:translate-y-0 text-center select-none shrink-0"
                      style={{ borderRadius: "50px" }}
                    >
                      <GmailIcon className="h-5 w-5 shrink-0" />
                      <span>reachmazen@gmail.com</span>
                    </a>

                    {/* BUTTON 2 — GitHub */}
                    <a
                      href="https://github.com/the1mazen"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-[50px] border border-purple-500/70 hover:border-purple-400 bg-transparent px-[28px] py-[14px] text-[0.9rem] font-semibold text-white font-open-sans-custom transition-transform duration-200 hover:-translate-y-[2px] active:translate-y-0 text-center select-none shrink-0"
                      style={{ borderRadius: "50px" }}
                    >
                      <GithubIcon className="h-5 w-5 shrink-0 text-white fill-current" />
                      <span>github.com/the1mazen</span>
                    </a>
                  </div>
                </div>
              </ContactCard>
            </div>
          </section>
        </div>
      </main>
    </LandingVideoProvider>
  )
}

function GmailIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="52 42 88 66" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
      <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
      <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
      <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
      <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
    </svg>
  )
}

function GithubIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}
