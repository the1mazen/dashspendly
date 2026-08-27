import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

function Feature() {
  return (
    <div className="w-full py-10 sm:py-16 lg:py-0">
      <div className="mx-auto w-full max-w-7xl px-2 sm:px-4">
        <div className="flex gap-4 py-20 flex-col items-start lg:py-0">
          <div>
            <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm">Personal finance</Badge>
          </div>
          <div className="flex gap-2 flex-col">
            <h2 className="text-[1.35rem] leading-tight sm:text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-open-sans-custom text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="text-[0.8rem] sm:text-lg max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-gray-300 font-open-sans-custom [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)]">
              Track your money without the clutter of features you&apos;ll never use.
            </p>
          </div>
          <div className="flex gap-10 pt-12 flex-col w-full">
            <div className="grid grid-cols-2 items-start gap-x-4 gap-y-8 sm:gap-10 lg:grid-cols-3">
              <div className="flex flex-row gap-6 w-full items-start">
                <Check className="w-[1.05rem] h-[1.05rem] mt-2 text-white" strokeWidth={3} />
                <div className="flex flex-col gap-1">
                  <p className="text-[0.78rem] leading-snug sm:text-base text-white font-open-sans-custom">Multiple accounts</p>
                  <p className="text-gray-300 text-[0.72rem] leading-5 sm:text-sm font-open-sans-custom">
                    Track cash, bank, and cards in one place.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-[1.05rem] h-[1.05rem] mt-2 text-white" strokeWidth={3} />
                <div className="flex flex-col gap-1">
                  <p className="text-[0.78rem] leading-snug sm:text-base text-white font-open-sans-custom">Smart categories</p>
                  <p className="text-gray-300 text-[0.72rem] leading-5 sm:text-sm font-open-sans-custom">
                    Organize spending your way, with sensible defaults built in.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-[1.05rem] h-[1.05rem] mt-2 text-white" strokeWidth={3} />
                <div className="flex flex-col gap-1">
                  <p className="text-[0.78rem] leading-snug sm:text-base text-white font-open-sans-custom">Real-time balance</p>
                  <p className="text-gray-300 text-[0.72rem] leading-5 sm:text-sm font-open-sans-custom">
                    Always know exactly where you stand.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 w-full items-start">
                <Check className="w-[1.05rem] h-[1.05rem] mt-2 text-white" strokeWidth={3} />
                <div className="flex flex-col gap-1">
                  <p className="text-[0.78rem] leading-snug sm:text-base text-white font-open-sans-custom">Searchable history</p>
                  <p className="text-gray-300 text-[0.72rem] leading-5 sm:text-sm font-open-sans-custom">Find any transaction in seconds.</p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-[1.05rem] h-[1.05rem] mt-2 text-white" strokeWidth={3} />
                <div className="flex flex-col gap-1">
                  <p className="text-[0.78rem] leading-snug sm:text-base text-white font-open-sans-custom">Net worth tracking</p>
                  <p className="text-gray-300 text-[0.72rem] leading-5 sm:text-sm font-open-sans-custom">
                    Choose which accounts count, see the full picture.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-[1.05rem] h-[1.05rem] mt-2 text-white" strokeWidth={3} />
                <div className="flex flex-col gap-1">
                  <p className="text-[0.78rem] leading-snug sm:text-base text-white font-open-sans-custom">Private by design</p>
                  <p className="text-gray-300 text-[0.72rem] leading-5 sm:text-sm font-open-sans-custom">
                    Your data stays yours, always.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { Feature }
