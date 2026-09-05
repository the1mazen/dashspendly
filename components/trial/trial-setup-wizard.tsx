'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrialMode } from '@/lib/trial-mode-context'
import { useFinanceData } from '@/lib/finance-data'
import { useUserProfile } from '@/lib/user-profile'
import {
  Wallet,
  ArrowRightLeft,
  Receipt,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Plus,
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

  // Inline account creation form state
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState('checking')
  const [startingBalance, setStartingBalance] = useState('')
  const [accountCurrency, setAccountCurrency] = useState(profile.currency || 'USD')
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

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
      <div className="fixed inset-0 z-[9950] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-3xl p-6 sm:p-7 border shadow-2xl backdrop-blur-2xl text-white selection:bg-[#5EEAD4] selection:text-[#120824]"
          style={{
            background: 'linear-gradient(135deg, rgba(32, 12, 62, 0.92) 0%, rgba(18, 48, 38, 0.88) 50%, rgba(42, 48, 16, 0.88) 100%)',
            borderColor: 'rgba(255, 255, 255, 0.16)',
            boxShadow: '0 20px 50px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#FEF08A]">
                <Sparkles className="size-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider font-display text-white/90">
                  Quick Setup Guide
                </h3>
                <p className="text-[11px] font-sans text-white/60">
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
                        ? 'w-5 bg-[#5EEAD4]'
                        : isPassed
                        ? 'w-2 bg-[#34D399]'
                        : 'w-1.5 bg-white/20'
                    }`}
                  />
                )
              })}
            </div>
          </div>

          {/* Step 1: Create First Account (Inline form) */}
          {wizardStep === 'account' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold font-display text-white">
                  Create Your First Account
                </h4>
                <p className="text-xs text-white/70 font-sans mt-0.5 leading-relaxed">
                  Spendly needs at least one account to calculate your net worth and 50/30/20 budget.
                </p>
              </div>

              {createError && (
                <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-sans">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateInlineAccount} className="space-y-3 pt-1">
                <div>
                  <label className="text-[10.5px] font-semibold uppercase tracking-wider block mb-1 text-white/75 font-sans">
                    Account Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QNB Checking, Cash Wallet, Card"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-sans text-white focus:outline-none border border-white/10 bg-black/40 focus:border-[#5EEAD4]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-semibold uppercase tracking-wider block mb-1 text-white/75 font-sans">
                      Account Type
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-sans text-white focus:outline-none border border-white/10 bg-[#160a2c] focus:border-[#5EEAD4]/50 cursor-pointer"
                    >
                      <option value="checking">Bank / Checking</option>
                      <option value="cash">Cash wallet</option>
                      <option value="credit">Credit card</option>
                      <option value="savings">Savings account</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold uppercase tracking-wider block mb-1 text-white/75 font-sans">
                      Currency
                    </label>
                    <select
                      value={accountCurrency}
                      onChange={(e) => setAccountCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-sans text-white focus:outline-none border border-white/10 bg-[#160a2c] focus:border-[#5EEAD4]/50 cursor-pointer"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EGP">EGP (EGP)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="SAR">SAR (SAR)</option>
                      <option value="AED">AED (AED)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] font-semibold uppercase tracking-wider block mb-1 text-white/75 font-sans">
                    Starting Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-mono text-white focus:outline-none border border-white/10 bg-black/40 focus:border-[#5EEAD4]/50"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isCreatingAccount || !accountName.trim()}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#120824] shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: 'linear-gradient(90deg, #5EEAD4 0%, #A7F3D0 40%, #FEF08A 100%)' }}
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
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold font-display text-white">
                  Add Your First Transaction
                </h4>
                <p className="text-xs text-white/70 font-sans mt-0.5 leading-relaxed">
                  Log an expense, income, or transfer to see real-time cash flow and charts in action.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 space-y-2 text-xs text-white/80 font-sans">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-[#5EEAD4]" />
                  <span>Account successfully created</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-[#5EEAD4]" />
                  <span>You can log a transaction now or skip to later</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep('bill')}
                  className="py-2.5 px-3 rounded-xl text-xs font-semibold text-white/70 hover:text-white border border-white/10 hover:bg-white/10 transition text-center cursor-pointer"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  onClick={handleAddTxClick}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold text-[#120824] shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(90deg, #5EEAD4 0%, #A7F3D0 40%, #FEF08A 100%)' }}
                >
                  <ArrowRightLeft className="size-3.5" />
                  <span>Add Transaction</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Recurring Bill (Optional) */}
          {wizardStep === 'bill' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold font-display text-white">
                  Set Up Recurring Bills
                </h4>
                <p className="text-xs text-white/70 font-sans mt-0.5 leading-relaxed">
                  Track rent, electricity, gym, or subscriptions to calculate fixed commitments and safe-to-spend allowances.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 space-y-2 text-xs text-white/80 font-sans">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-[#FEF08A]" />
                  <span>Safeguards your 50/30/20 budget framework</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-[#FEF08A]" />
                  <span>1-click mark as paid auto-records transactions</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep('celebration')}
                  className="py-2.5 px-3 rounded-xl text-xs font-semibold text-white/70 hover:text-white border border-white/10 hover:bg-white/10 transition text-center cursor-pointer"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  onClick={handleAddBillClick}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold text-[#120824] shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(90deg, #5EEAD4 0%, #A7F3D0 40%, #FEF08A 100%)' }}
                >
                  <Receipt className="size-3.5" />
                  <span>Add Bill</span>
                </button>
              </div>
            </div>
          )}

          {/* Celebration / Guided Tour Launch */}
          {wizardStep === 'celebration' && (
            <div className="space-y-4 text-center py-2">
              <div className="mx-auto size-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[#5EEAD4] flex items-center justify-center shadow-lg shadow-emerald-950/50">
                <Sparkles className="size-6 animate-pulse" />
              </div>

              <div>
                <h4 className="text-lg font-bold font-display text-white">
                  You're all set! 🚀
                </h4>
                <p className="text-xs text-white/70 font-sans mt-1 leading-relaxed">
                  Your Spendly workspace is active. Let's take a quick interactive tour through the dashboard to show you around.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleStartTour}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#120824] shadow-lg transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(90deg, #5EEAD4 0%, #A7F3D0 40%, #FEF08A 100%)' }}
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
