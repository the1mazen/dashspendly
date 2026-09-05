'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrialMode } from '@/lib/trial-mode-context'
import { useFinanceData } from '@/lib/finance-data'
import {
  Wallet,
  ArrowRightLeft,
  ReceiptText,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react'

interface TrialSetupWizardProps {
  onOpenAddAccount: () => void
  onOpenAddTransaction: () => void
  onOpenAddBill: () => void
}

export function TrialSetupWizard({
  onOpenAddAccount,
  onOpenAddTransaction,
  onOpenAddBill,
}: TrialSetupWizardProps) {
  const { isWizardOpen, wizardStep, setWizardStep, closeWizard, startPageTour } = useTrialMode()
  const { accounts } = useFinanceData()

  if (!isWizardOpen) return null

  const hasAccount = accounts.length > 0

  const handleStartTour = () => {
    closeWizard()
    startPageTour('dashboard')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9950] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-lg bg-card/95 dark:bg-zinc-900/95 border border-white/20 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-xl"
        >
          {/* Decorative glowing gradient orbs */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Stepper Header */}
          <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick Setup Guide
                </h3>
                <p className="text-xs font-medium text-foreground/80">
                  {wizardStep === 'account' && 'Step 1 of 3: Primary Account (Required)'}
                  {wizardStep === 'transaction' && 'Step 2 of 3: First Activity (Optional)'}
                  {wizardStep === 'bill' && 'Step 3 of 3: Fixed Bills (Optional)'}
                  {wizardStep === 'celebration' && 'Setup Complete!'}
                </p>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-1.5">
              {(['account', 'transaction', 'bill'] as const).map((s, idx) => {
                const isCurrent = wizardStep === s
                const isPassed =
                  (s === 'account' && hasAccount) ||
                  (wizardStep === 'transaction' && idx === 0) ||
                  (wizardStep === 'bill' && idx <= 1) ||
                  wizardStep === 'celebration'

                return (
                  <div
                    key={s}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? 'w-6 bg-primary'
                        : isPassed
                        ? 'w-2.5 bg-emerald-500'
                        : 'w-2 bg-muted/60'
                    }`}
                  />
                )
              })}
            </div>
          </div>

          {/* Step 1: Account Creation (Required, No skip) */}
          {wizardStep === 'account' && (
            <div className="space-y-6 relative z-10">
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary text-primary-foreground shrink-0 shadow-lg shadow-primary/20">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    Create Your First Account
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Spendly requires at least one active account (such as your Bank, Cash Wallet, or Card) to track cash flow and budget allocations.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Supports EGP, USD, EUR, GBP, SAR, AED and multiple currencies</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Track opening balance and live income/expense adjustments</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onOpenAddAccount}
                  className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl shadow-lg shadow-primary/25 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  <Wallet className="w-4 h-4" />
                  Create First Account
                </button>
                <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-muted-foreground/80">
                  <Lock className="w-3 h-3" />
                  <span>Account setup is required to initialize your dashboard</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Transaction (Optional) */}
          {wizardStep === 'transaction' && (
            <div className="space-y-6 relative z-10">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-500 text-white shrink-0 shadow-lg shadow-emerald-500/20">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    Record Your First Transaction
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Log an income, an expense, or a transfer between accounts. You can also skip this and add transactions later.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setWizardStep('bill')}
                  className="w-full py-3 px-4 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground font-medium rounded-2xl border border-border/60 transition text-sm text-center"
                >
                  Skip for now
                </button>

                <button
                  onClick={onOpenAddTransaction}
                  className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl shadow-lg shadow-primary/25 transition flex items-center justify-center gap-2 text-sm text-center"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Add Transaction
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Bill (Optional) */}
          {wizardStep === 'bill' && (
            <div className="space-y-6 relative z-10">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-500 text-white shrink-0 shadow-lg shadow-amber-500/20">
                  <ReceiptText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    Set Up Recurring Bills
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Track rent, electricity, gym, or software subscriptions. Spendly uses fixed commitments to safeguard your 50/30/20 budget.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setWizardStep('celebration')}
                  className="w-full py-3 px-4 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground font-medium rounded-2xl border border-border/60 transition text-sm text-center"
                >
                  Skip for now
                </button>

                <button
                  onClick={onOpenAddBill}
                  className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl shadow-lg shadow-primary/25 transition flex items-center justify-center gap-2 text-sm text-center"
                >
                  <ReceiptText className="w-4 h-4" />
                  Add Bill
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Celebration & Guided Tour prompt */}
          {wizardStep === 'celebration' && (
            <div className="space-y-6 relative z-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border-2 border-emerald-500/30 shadow-xl shadow-emerald-500/20 animate-bounce">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-foreground">
                  You're all set! 🚀
                </h4>
                <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                  Your Spendly workspace is active. As you navigate through each section, our interactive spotlight tour will guide you step-by-step.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleStartTour}
                  className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl shadow-lg shadow-primary/25 transition flex items-center justify-center gap-2 text-sm"
                >
                  Start Dashboard Tour
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={closeWizard}
                  className="w-full py-2.5 px-4 text-xs font-medium text-muted-foreground hover:text-foreground transition"
                >
                  Explore freely
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
