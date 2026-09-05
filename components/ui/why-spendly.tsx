import { PlusIcon } from "lucide-react"
import DotPattern from "@/components/ui/dot-pattern"

const stats = [
  {
    number: "$0",
    label: "Cost — free forever, no catches",
  },
  {
    number: "6+",
    label: "Currencies supported out of the box",
  },
  {
    number: "∞",
    label: "Accounts, categories, and budgets you can create",
  },
]

const pillars = [
  {
    title: "Manual-first",
    tagline: "You control the data",
    description:
      "No automatic bank sync. You enter what comes in and goes out — which keeps you engaged with your money.",
  },
  {
    title: "Private by design",
    tagline: "Your data stays yours",
    description:
      "Spendly never connects to your bank. Your credentials never leave your device. Reset everything in one tap.",
  },
  {
    title: "Simple by choice",
    tagline: "Answers, not noise",
    description:
      "How much do I really have? Where did my money go? What's coming next? Built to answer those questions — nothing more, nothing less.",
  },
]

export function WhySpendly() {
  return (
    <div className="relative mx-auto w-full max-w-5xl rounded-lg border-2 border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-10 shadow-lg">
      <DotPattern width={5} height={5} />
      <PlusIcon className="absolute -top-3 -left-3 h-6 w-6 text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_60%)]" />
      <PlusIcon className="absolute -top-3 -right-3 h-6 w-6 text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_60%)]" />
      <PlusIcon className="absolute -bottom-3 -left-3 h-6 w-6 text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_60%)]" />
      <PlusIcon className="absolute -right-3 -bottom-3 h-6 w-6 text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_60%)]" />

      <div className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-5xl text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)] font-open-sans-custom">
            Built around one question: where does my money go?
          </h2>
          <p className="mt-3 text-sm sm:text-base md:text-lg text-gray-300 font-open-sans-custom [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)]">
            Spendly doesn&apos;t try to replace your bank. It helps you understand it.
          </p>
        </div>

        {/* Three large stat figures */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {stats.map((stat, index) => (
            <div key={index} className="pt-4 sm:pt-0 sm:px-4 first:pt-0">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold font-mono text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)] tracking-tight">
                {stat.number}
              </div>
              <p className="mt-2 text-xs sm:text-sm text-gray-300 font-open-sans-custom [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Three pillar cards below the stats */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {pillars.map((pillar, index) => (
            <div
              key={index}
              className="relative rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-sm flex flex-col justify-start"
            >
              <h3 className="text-base sm:text-lg font-bold text-white font-open-sans-custom [text-shadow:_0_2px_8px_rgb(0_0_0_/_40%)]">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/80 font-medium font-open-sans-custom mt-0.5 mb-2 [text-shadow:_0_2px_6px_rgb(0_0_0_/_30%)]">
                &ldquo;{pillar.tagline}&rdquo;
              </p>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-open-sans-custom [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}