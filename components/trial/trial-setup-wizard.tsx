'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrialMode } from '@/lib/trial-mode-context'
import { useFinanceData } from '@/lib/finance-data'
import { useUserProfile } from '@/lib/user-profile'
import { useDashboardTheme } from '@/components/cards/financial-analytics-dashboard'
import {
  Wallet,
  ArrowRightLeft,
  Receipt,
  Sparkles,
  CheckCircle2,
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
  const { accounts, createAccount } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()

  // Inline account creation form state
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState('checking')
  const [startingBalance, setStartingBalance] = useState('')
  const [accountCurrency, setAccountCurrency] = useState(profile.currency || 'USD')
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (profile.currency) {
      setAccountCurrency(profile.currency)
    }
  }, [profile.currency])

  if (!isWizardOpen) return null

  const hasAccount = accounts.length > 0

  const handleCreateInlineAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountName.trim()) return

    setIsCreatingAccount(true)
    setCreateError(null)

    try {
      await createAccount({
        name: accountName.trim(),
        type: accountType,
        starting_balance: parseFloat(startingBalance) || 0,
        currency: accountCurrency || profile.currency || 'USD',
      })
      // Advance to step 2 automatically
      setWizardStep('transaction')
    } catch (err: any) {
      console.error('Trial account creation error:', err)
      setCreateError(err?.message || 'Failed to create account. Please try again.')
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleStartTour = () => {
    closeWizard()
    startPageTour('dashboard')
  }

  const handleAddTxClick = () => {
    closeWizard()
    onOpenAddTransaction()
  }

  const handleAddBillClick = () => {
    closeWizard()
    onOpenAddBill()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9950] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-3xl p-6 sm:p-7 border-2 border-white/20 backdrop-blur-2xl text-white selection:bg-[#5EEAD4] selection:text-[#120824] shadow-[0_8px_32px_rgba(0,0,0,0.45)] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 100%)',
          }}
        >
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between pb-3.5 mb-4 border-b border-white/15">
            <div className="flex items-center gap-2.5">
              <span className="size-8 rounded-xl border border-white/20 bg-white/10 flex items-center justify-center font-bold shadow-sm text-[#5EEAD4]">
                <Sparkles className="size-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider font-display text-white">
                  Quick Setup Guide
                </h3>
                <p className="text-[11px] font-sans text-white/75 mt-0.5">
                  {wizardStep === 'account' && 'Step 1 of 3: Primary Account'}
                  {wizardStep === 'transaction' && 'Step 2 of 3: First Activity'}
                  {wizardStep === 'bill' && 'Step 3 of 3: Recurring Bills'}
                  {wizardStep === 'celebration' && 'Ready to Explore!'}
                </p>
              </div>
            </div>

            {/* Stepper Dots */}
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
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? 'w-5 bg-gradient-to-r from-[#5EEAD4] to-[#A7F3D0]'
                        : isPassed
                        ? 'w-2 bg-[#4ADE80]'
                        : 'w-1.5 bg-white/20'
                    }`}
                  />
                )
              })}
            </div>
          </div>

          {/* Step 1: Create First Account (Inline form) */}
          {wizardStep === 'account' && (
            <div className="relative z-10 space-y-4">
              <div>
                <h4 className="text-base font-bold font-display text-white">
                  Create Your First Account
                </h4>
                <p className="text-xs text-white/75 font-sans mt-0.5 leading-relaxed">
                  Spendly needs at least one account to calculate your net worth and 50/30/20 budget.
                </p>
              </div>

              {createError && (
                <div className="p-2.5 rounded-xl border border-red-500/30 bg-red-500/15 text-xs text-red-200 font-sans">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateInlineAccount} className="space-y-3 pt-1">
                <div>
                  <label className="text-[10.5px] font-semibold uppercase tracking-wider block mb-1 text-white/80 font-sans">
                    Account Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Checking Account, Cash Wallet, Card"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-sans text-white focus:outline-none border border-white/20 bg-white/10 focus:border-[#5EEAD4] focus:ring-1 focus:ring-[#5EEAD4]/40 placeholder-white/40 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-semibold uppercase tracking-wider block mb-1 text-white/80 font-sans">
                      Account Type
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs font-sans text-white focus:outline-none border border-white/20 bg-white/10 focus:border-[#5EEAD4] focus:ring-1 focus:ring-[#5EEAD4]/40 cursor-pointer transition-colors"
                    >
                      <option value="checking" className="bg-[#171722] text-white">Bank / Checking</option>
                      <option value="cash" className="bg-[#171722] text-white">Cash wallet</option>
                      <option value="credit" className="bg-[#171722] text-white">Credit card</option>
                      <option value="savings" className="bg-[#171722] text-white">Savings account</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold uppercase tracking-wider block mb-1 text-white/80 font-sans">
                      Currency
                    </label>
                    <select
                      value={accountCurrency}
                      onChange={(e) => setAccountCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs font-sans text-white focus:outline-none border border-white/20 bg-white/10 focus:border-[#5EEAD4] focus:ring-1 focus:ring-[#5EEAD4]/40 cursor-pointer transition-colors"
                    >
                      <option value="USD" className="bg-[#171722] text-white">USD ($)</option>
                      <option value="EGP" className="bg-[#171722] text-white">EGP (EGP)</option>
                      <option value="EUR" className="bg-[#171722] text-white">EUR (€)</option>
                      <option value="GBP" className="bg-[#171722] text-white">GBP (£)</option>
                      <option value="SAR" className="bg-[#171722] text-white">SAR (SAR)</option>
                      <option value="AED" className="bg-[#171722] text-white">AED (AED)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] font-semibold uppercase tracking-wider block mb-1 text-white/80 font-sans">
                    Starting Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono text-white focus:outline-none border border-white/20 bg-white/10 focus:border-[#5EEAD4] focus:ring-1 focus:ring-[#5EEAD4]/40 placeholder-white/40 transition-colors"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isCreatingAccount || !accountName.trim()}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5EEAD4] via-[#A7F3D0] to-[#FEF08A] text-[#120824] shadow-[0_4px_20px_rgba(94,234,212,0.35)] hover:shadow-[0_6px_25px_rgba(94,234,212,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Wallet className="size-3.5" />
                    <span>{isCreatingAccount ? 'Creating account...' : 'Create Account & Continue'}</span>
                  </button>

                  <p className="text-[10.5px] text-white/50 text-center font-sans">
                    Account setup is required to initialize your dashboard
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: First Transaction (Optional) */}
          {wizardStep === 'transaction' && (
            <div className="relative z-10 space-y-4">
              <div>
                <h4 className="text-base font-bold font-display text-white">
                  Add Your First Transaction
                </h4>
                <p className="text-xs text-white/75 font-sans mt-0.5 leading-relaxed">
                  Log an expense, income, or transfer to see real-time cash flow and charts in action.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-md space-y-2 text-xs text-white/90 font-sans">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-[#4ADE80]" />
                  <span>Account successfully created</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-[#4ADE80]" />
                  <span>You can log a transaction now or skip to later</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep('bill')}
                  className="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-white/90 hover:text-white border border-white/20 bg-white/10 hover:bg-white/20 transition-all text-center cursor-pointer"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  onClick={handleAddTxClick}
                  className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5EEAD4] via-[#A7F3D0] to-[#FEF08A] text-[#120824] shadow-[0_4px_16px_rgba(94,234,212,0.35)] hover:shadow-[0_6px_20px_rgba(94,234,212,0.5)] transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                >
                  <ArrowRightLeft className="size-3.5" />
                  <span>Add Transaction</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Recurring Bill (Optional) */}
          {wizardStep === 'bill' && (
            <div className="relative z-10 space-y-4">
              <div>
                <h4 className="text-base font-bold font-display text-white">
                  Set Up Recurring Bills
                </h4>
                <p className="text-xs text-white/75 font-sans mt-0.5 leading-relaxed">
                  Track rent, electricity, gym, or subscriptions to calculate fixed commitments and safe-to-spend allowances.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-md space-y-2 text-xs text-white/90 font-sans">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-[#5EEAD4]" />
                  <span>Safeguards your 50/30/20 budget framework</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-[#5EEAD4]" />
                  <span>1-click mark as paid auto-records transactions</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep('celebration')}
                  className="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-white/90 hover:text-white border border-white/20 bg-white/10 hover:bg-white/20 transition-all text-center cursor-pointer"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  onClick={handleAddBillClick}
                  className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5EEAD4] via-[#A7F3D0] to-[#FEF08A] text-[#120824] shadow-[0_4px_16px_rgba(94,234,212,0.35)] hover:shadow-[0_6px_20px_rgba(94,234,212,0.5)] transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                >
                  <Receipt className="size-3.5" />
                  <span>Add Bill</span>
                </button>
              </div>
            </div>
          )}

          {/* Celebration / Guided Tour Launch */}
          {wizardStep === 'celebration' && (
            <div className="relative z-10 space-y-4 text-center py-2">
              <div className="mx-auto size-14 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center shadow-lg text-[#5EEAD4]">
                <Sparkles className="size-7 animate-pulse" />
              </div>

              <div>
                <h4 className="text-lg font-bold font-display text-white">
                  You're all set! 🚀
                </h4>
                <p className="text-xs text-white/75 font-sans mt-1 leading-relaxed max-w-xs mx-auto">
                  Your Spendly workspace is active. Let's take a quick interactive tour through the dashboard to show you around.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleStartTour}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5EEAD4] via-[#A7F3D0] to-[#FEF08A] text-[#120824] shadow-[0_4px_20px_rgba(94,234,212,0.35)] hover:shadow-[0_6px_25px_rgba(94,234,212,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                >
                  <span>Start Dashboard Tour</span>
                  <ArrowRight className="size-3.5" />
                </button>

                <button
                  type="button"
                  onClick={closeWizard}
                  className="w-full py-1.5 text-xs text-white/60 hover:text-white transition cursor-pointer"
                >
                  Explore on my own
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
