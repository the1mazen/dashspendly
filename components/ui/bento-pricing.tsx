import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import DotPattern from "@/components/ui/dot-pattern"

const features = [
  "Multiple accounts",
  "Smart categories",
  "Real-time balance",
  "Searchable history",
  "Net worth tracking",
  "Private by design",
]

export function BentoPricing() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="relative overflow-hidden rounded-md border-2 border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8">
        <DotPattern width={5} height={5} />
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-open-sans-custom text-white">
              FREE, FOREVER
            </span>
            <Button asChild className="bg-white text-black hover:bg-gray-100 font-open-sans-custom text-xs">
              <Link href="/login">Get started</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-baseline gap-2">
            <span className="font-mono text-5xl font-semibold tracking-tight text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">
              $0
            </span>
            <span className="text-sm text-gray-300 font-open-sans-custom">/month</span>
          </div>
          <ul className="mt-8 grid gap-4 text-sm text-gray-300 font-open-sans-custom sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="h-4 w-4 shrink-0 text-white" strokeWidth={3} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
