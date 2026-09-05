import { Check } from "lucide-react"

const featureItems = [
  {
    title: "Multiple accounts",
    description:
      "Add bank accounts, cash wallets, credit cards, and savings — each with a starting balance and your preferred currency (EGP, USD, EUR, GBP, SAR, AED).",
  },
  {
    title: "Full transaction log",
    description:
      "Record income, expenses, transfers, and fees. Attach notes, dates, and categories. Filter and review everything from the dashboard.",
  },
  {
    title: "Financial health at a glance",
    description:
      "Your dashboard shows total net worth, this month's income and expenses, recent transactions, account balances, and category budget status — all in one view.",
  },
  {
    title: "Bill and income planner",
    description:
      "Plan recurring bills, expected income, and transfers. Spendly calculates what's coming in, what's going out, and what you'll have left.",
  },
  {
    title: "Smart categories",
    description:
      "Create income and expense categories, attach budgets or spending limits to each, and keep your money organized exactly the way you think about it.",
  },
  {
    title: "Budget planner",
    description:
      "Build weekly, monthly, or custom-period budgets. Supports fixed commitments, the 50/30/20 framework, spending suggestions from past activity, and budget-health warnings.",
  },
  {
    title: "Held funds",
    description:
      "Separate money reserved for a specific purpose — or held on behalf of someone else — from your main balances.",
  },
  {
    title: "Yours to personalize",
    description:
      "Switch currencies, toggle dark or light mode, pause animated backgrounds, and reset your data anytime. Your preferences save automatically.",
  },
  {
    title: "Free, forever",
    description:
      "No trials, no tiers, no subscription fees. Every feature is available to every user from day one.",
  },
]

function Feature() {
  return (
    <div className="w-full py-8 sm:py-12 lg:py-0">
      <div className="mx-auto w-full max-w-7xl px-2 sm:px-4">
        <div className="flex gap-4 py-8 flex-col items-start lg:py-0">
          <div className="flex gap-2 flex-col">
            <h2 className="text-[1.35rem] leading-tight sm:text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-open-sans-custom text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="text-[0.8rem] sm:text-lg max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-gray-300 font-open-sans-custom [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)]">
              Track your money without the clutter of features you&apos;ll never use.
            </p>
          </div>
          <div className="flex gap-10 pt-8 sm:pt-12 flex-col w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-start gap-x-4 gap-y-6 sm:gap-x-8 sm:gap-y-8 lg:gap-10">
              {featureItems.map((item, index) => (
                <div key={index} className="flex flex-row gap-4 sm:gap-6 w-full items-start">
                  <Check className="w-[1.05rem] h-[1.05rem] mt-1 shrink-0 text-white" strokeWidth={3} />
                  <div className="flex flex-col gap-1">
                    <p className="text-[0.85rem] leading-snug sm:text-base text-white font-open-sans-custom font-medium">
                      {item.title}
                    </p>
                    <p className="text-gray-300 text-[0.75rem] leading-5 sm:text-sm font-open-sans-custom">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { Feature }
