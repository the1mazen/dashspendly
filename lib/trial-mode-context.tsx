'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { PAGE_TOURS, PageTour } from './page-tour-config'
import { useFinanceData } from './finance-data'

export type WizardStep = 'account' | 'transaction' | 'bill' | 'celebration'

interface TrialModeContextType {
  isTrialActive: boolean
  isWizardOpen: boolean
  wizardStep: WizardStep
  setWizardStep: (step: WizardStep) => void
  openWizard: (step?: WizardStep) => void
  closeWizard: () => void
  
  // Page Spotlight Tour State
  isTourActive: boolean
  currentTour: PageTour | null
  currentTourStepIndex: number
  seenPageTours: string[]
  startPageTour: (pageId: string, force?: boolean) => void
  nextTourStep: () => void
  prevTourStep: () => void
  skipCurrentTour: () => void
  completeCurrentTour: () => void
  completeTrialMode: () => void
  onNavigateSection: (sectionId: string) => void
}

const TrialModeContext = createContext<TrialModeContextType | null>(null)

const STORAGE_KEY_COMPLETED = 'spendly_trial_completed_v1'
const STORAGE_KEY_SEEN_PAGES = 'spendly_trial_seen_pages_v1'
const STORAGE_KEY_WIZARD_STEP = 'spendly_trial_wizard_step_v1'

export function TrialModeProvider({ children }: { children: React.ReactNode }) {
  const { accounts, loading } = useFinanceData()
  
  const [isTrialActive, setIsTrialActive] = useState(false)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStepState] = useState<WizardStep>('account')
  
  const [isTourActive, setIsTourActive] = useState(false)
  const [currentTour, setCurrentTour] = useState<PageTour | null>(null)
  const [currentTourStepIndex, setCurrentTourStepIndex] = useState(0)
  const [seenPageTours, setSeenPageTours] = useState<string[]>([])
  
  const initialCheckDoneRef = useRef(false)
  const prevAccountsCountRef = useRef(accounts.length)

  // Load seen pages and trial status from localStorage
  useEffect(() => {
    try {
      const isCompleted = localStorage.getItem(STORAGE_KEY_COMPLETED) === 'true'
      if (isCompleted) {
        setIsTrialActive(false)
        return
      }

      const seenStr = localStorage.getItem(STORAGE_KEY_SEEN_PAGES)
      if (seenStr) {
        setSeenPageTours(JSON.parse(seenStr))
      }

      const savedStep = localStorage.getItem(STORAGE_KEY_WIZARD_STEP) as WizardStep | null
      if (savedStep) {
        setWizardStepState(savedStep)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Check if trial mode should be started for new users (0 accounts)
  useEffect(() => {
    if (loading || initialCheckDoneRef.current) return
    initialCheckDoneRef.current = true

    try {
      const isCompleted = localStorage.getItem(STORAGE_KEY_COMPLETED) === 'true'
      if (isCompleted) {
        setIsTrialActive(false)
        return
      }

      // If user has 0 accounts, they are a new user -> trigger trial mode
      if (accounts.length === 0) {
        setIsTrialActive(true)
        setIsWizardOpen(true)
        setWizardStepState('account')
      } else {
        // User already has accounts from previous sessions
        setIsTrialActive(false)
      }
    } catch {
      // Ignore
    }
  }, [loading, accounts.length])

  // Watch for account creation while on step 'account' -> auto advance to 'transaction'
  useEffect(() => {
    if (prevAccountsCountRef.current === 0 && accounts.length > 0 && isTrialActive) {
      if (wizardStep === 'account') {
        setWizardStepState('transaction')
        try {
          localStorage.setItem(STORAGE_KEY_WIZARD_STEP, 'transaction')
        } catch {
          // Ignore
        }
      }
    }
    prevAccountsCountRef.current = accounts.length
  }, [accounts.length, isTrialActive, wizardStep])

  const setWizardStep = useCallback((step: WizardStep) => {
    setWizardStepState(step)
    try {
      localStorage.setItem(STORAGE_KEY_WIZARD_STEP, step)
    } catch {
      // Ignore
    }
  }, [])

  const openWizard = useCallback((step?: WizardStep) => {
    if (step) setWizardStep(step)
    setIsWizardOpen(true)
  }, [setWizardStep])

  const closeWizard = useCallback(() => {
    setIsWizardOpen(false)
  }, [])

  // Start tour for a specific page
  const startPageTour = useCallback((pageId: string, force = false) => {
    const tourConfig = PAGE_TOURS[pageId]
    if (!tourConfig) return

    try {
      const isCompleted = localStorage.getItem(STORAGE_KEY_COMPLETED) === 'true'
      if (isCompleted && !force) return
      
      const seen = JSON.parse(localStorage.getItem(STORAGE_KEY_SEEN_PAGES) || '[]')
      if (seen.includes(pageId) && !force) return
    } catch {
      // Ignore
    }

    // Small delay to ensure target DOM elements have mounted
    setTimeout(() => {
      setCurrentTour(tourConfig)
      setCurrentTourStepIndex(0)
      setIsTourActive(true)
    }, 350)
  }, [])

  const completeCurrentTour = useCallback(() => {
    if (currentTour) {
      const pageId = currentTour.pageId
      setSeenPageTours((prev) => {
        const next = Array.from(new Set([...prev, pageId]))
        try {
          localStorage.setItem(STORAGE_KEY_SEEN_PAGES, JSON.stringify(next))
        } catch {
          // Ignore
        }
        return next
      })
    }
    setIsTourActive(false)
    setCurrentTour(null)
    setCurrentTourStepIndex(0)
  }, [currentTour])

  const nextTourStep = useCallback(() => {
    if (!currentTour) return
    if (currentTourStepIndex < currentTour.steps.length - 1) {
      setCurrentTourStepIndex((prev) => prev + 1)
    } else {
      // Completed tour for this page
      completeCurrentTour()
    }
  }, [currentTour, currentTourStepIndex, completeCurrentTour])

  const prevTourStep = useCallback(() => {
    if (currentTourStepIndex > 0) {
      setCurrentTourStepIndex((prev) => prev - 1)
    }
  }, [currentTourStepIndex])

  const skipCurrentTour = useCallback(() => {
    completeCurrentTour()
  }, [completeCurrentTour])

  const completeTrialMode = useCallback(() => {
    setIsTrialActive(false)
    setIsWizardOpen(false)
    setIsTourActive(false)
    setCurrentTour(null)
    try {
      localStorage.setItem(STORAGE_KEY_COMPLETED, 'true')
      localStorage.removeItem(STORAGE_KEY_WIZARD_STEP)
    } catch {
      // Ignore
    }
  }, [])

  // When user navigates to a new section/page
  const onNavigateSection = useCallback((sectionId: string) => {
    if (!isTrialActive) return
    if (isWizardOpen) return // Wait until wizard completes

    // If page tour hasn't been seen yet, trigger it automatically!
    try {
      const seen = JSON.parse(localStorage.getItem(STORAGE_KEY_SEEN_PAGES) || '[]')
      if (!seen.includes(sectionId) && PAGE_TOURS[sectionId]) {
        startPageTour(sectionId)
      }
    } catch {
      // Ignore
    }
  }, [isTrialActive, isWizardOpen, startPageTour])

  return (
    <TrialModeContext.Provider
      value={{
        isTrialActive,
        isWizardOpen,
        wizardStep,
        setWizardStep,
        openWizard,
        closeWizard,
        isTourActive,
        currentTour,
        currentTourStepIndex,
        seenPageTours,
        startPageTour,
        nextTourStep,
        prevTourStep,
        skipCurrentTour,
        completeCurrentTour,
        completeTrialMode,
        onNavigateSection,
      }}
    >
      {children}
    </TrialModeContext.Provider>
  )
}

export function useTrialMode() {
  const context = useContext(TrialModeContext)
  if (!context) {
    throw new Error('useTrialMode must be used within a TrialModeProvider')
  }
  return context
}
