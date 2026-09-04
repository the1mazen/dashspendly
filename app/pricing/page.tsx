import { FloatingNavbar } from "@/components/floating-navbar"
import { LandingBackground, LandingVideoProvider } from "@/components/landing-background"
import { BentoPricing } from "@/components/ui/bento-pricing"

export default function PricingPage() {
  return (
    <LandingVideoProvider>
      <main className="relative min-h-screen overflow-hidden bg-[#00042e] text-white">
        <LandingBackground />
        <FloatingNavbar />
        <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-32 text-center">
          <p className="mb-5 font-open-sans-custom text-xs uppercase tracking-[0.24em] text-white/60">
            Free, forever
          </p>
          <h1 className="max-w-3xl font-open-sans-custom text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            Everything Spendly offers is free for all users, always.
          </h1>
          <p className="mt-6 max-w-xl font-open-sans-custom text-base leading-relaxed text-white/70 md:text-lg">
            No trials, no tiers, no surprises. Just a simple way to understand your money.
          </p>
          <div className="mt-12 w-full">
            <BentoPricing />
          </div>
        </section>
      </main>
    </LandingVideoProvider>
  )
}
