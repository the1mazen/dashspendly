import { LiquidMetalBackground } from "@/components/liquid-metal-background"
import { FloatingNavbar } from "@/components/floating-navbar"
import { Feature } from "@/components/ui/feature-with-advantages"

export default function FeaturesPage() {
  return (
    <main className="relative min-h-screen">
      <LiquidMetalBackground />

      <div className="fixed inset-0 z-[5] bg-black/50" />

      <FloatingNavbar />

      {/* Features Section */}
      <section className="relative z-10 flex min-h-screen items-center px-4 py-20">
        <div className="mx-auto max-w-7xl w-full">
          <Feature />
        </div>
      </section>
    </main>
  )
}
