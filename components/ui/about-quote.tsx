"use client"

import DotPattern from "@/components/ui/dot-pattern"

export function AboutQuote() {
  return (
    <div className="mx-auto mb-10 max-w-7xl px-4 sm:px-6 md:mb-20 xl:px-0">
      <div className="relative flex flex-col border-2 border-white/20 rounded-lg backdrop-blur-sm bg-white/5 shadow-lg">
        <DotPattern width={5} height={5} />

        {/* Corner decorations */}
        <div className="absolute -left-1.5 -top-1.5 h-3 w-3 bg-white/80" />
        <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 bg-white/80" />
        <div className="absolute -right-1.5 -top-1.5 h-3 w-3 bg-white/80" />
        <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 bg-white/80" />

        <div className="relative z-20 mx-auto w-full max-w-6xl p-6 sm:p-8 md:p-12">
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)] mb-6 md:mb-10 font-open-sans-custom">
            About Spendly
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <p className="text-sm sm:text-base md:text-lg text-white/90 [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)] font-open-sans-custom leading-relaxed">
                Spendly started as a simple idea: managing money shouldn&apos;t need a spreadsheet or a subscription.
                It&apos;s built for anyone who wants a clear, honest view of their spending — no clutter, no features
                you&apos;ll never touch. Just your money, tracked simply.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-white/90 [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)] font-open-sans-custom leading-relaxed">
                It&apos;s not a banking platform. It&apos;s not an investment tool. It&apos;s the answer to the question
                most finance apps bury under a hundred screens: how much can I safely spend today?
              </p>
            </div>

            {/* Right Column: Three short blocks */}
            <div className="lg:col-span-5 space-y-6 pt-6 border-t border-white/10 lg:pt-0 lg:border-t-0 lg:border-l lg:border-white/15 lg:pl-8">
              {/* Block 1 */}
              <div className="space-y-1.5">
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-emerald-300 font-open-sans-custom [text-shadow:_0_2px_6px_rgb(0_0_0_/_30%)]">
                  The five questions Spendly answers
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-open-sans-custom [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]">
                  How much money do I really have? Where did my money go this month? What bills and income are coming
                  next? How much can I safely spend? Am I staying within my budget?
                </p>
              </div>

              {/* Block 2 */}
              <div className="space-y-1.5">
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-emerald-300 font-open-sans-custom [text-shadow:_0_2px_6px_rgb(0_0_0_/_30%)]">
                  What it&apos;s not trying to be
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-open-sans-custom [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]">
                  Spendly won&apos;t sync your bank, auto-categorize your transactions, or pitch you investment products.
                  That&apos;s a feature, not a limitation.
                </p>
              </div>

              {/* Block 3 */}
              <div className="space-y-1.5">
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-emerald-300 font-open-sans-custom [text-shadow:_0_2px_6px_rgb(0_0_0_/_30%)]">
                  Who it&apos;s built for
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-open-sans-custom [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]">
                  Anyone who&apos;s ever opened a spreadsheet or used notes app to track expenses and abandoned it three days later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
