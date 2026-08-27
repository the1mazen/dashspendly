"use client"

import DotPattern from "@/components/ui/dot-pattern"

export function AboutQuote() {
  return (
    <div className="mx-auto mb-10 max-w-7xl px-6 md:mb-20 xl:px-0">
      <div className="relative flex flex-col items-center border-2 border-white/20 rounded-lg backdrop-blur-sm bg-white/5">
        <DotPattern width={5} height={5} />

        {/* Corner decorations */}
        <div className="absolute -left-1.5 -top-1.5 h-3 w-3 bg-white/80" />
        <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 bg-white/80" />
        <div className="absolute -right-1.5 -top-1.5 h-3 w-3 bg-white/80" />
        <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 bg-white/80" />

        <div className="relative z-20 mx-auto max-w-5xl rounded-[40px] px-4 py-5 sm:px-6 md:p-10 xl:py-20">
          <h1 className="text-xl sm:text-2xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)] mb-6 md:mb-8 font-open-sans-custom">
            About Spendly
          </h1>
          <div className="space-y-4 md:space-y-6">
            <p className="text-sm leading-6 sm:text-base md:text-xl lg:text-2xl xl:text-3xl text-white/90 [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)] font-open-sans-custom leading-relaxed">
              Spendly started as a simple idea: managing money shouldn&apos;t need a spreadsheet or a subscription. It&apos;s
              built for anyone who wants a clear, honest view of their spending — no clutter, no features you&apos;ll never
              touch. Just your money, tracked simply.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
