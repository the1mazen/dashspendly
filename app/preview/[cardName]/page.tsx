"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { FinancialAnalyticsDashboard } from "@/components/cards"

const cardComponentMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "financial-analytics-dashboard": FinancialAnalyticsDashboard,
}

const demoPropsMap: Record<string, Record<string, unknown>> = {
  "financial-analytics-dashboard": {},
}

export default function PreviewPage({
  params,
}: {
  params: Promise<{ cardName: string }>
}) {
  const { cardName } = use(params)
  const Component = cardComponentMap[cardName]
  const props = demoPropsMap[cardName] ?? {}

  if (!Component) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      <Component {...props} />
    </main>
  )
}
