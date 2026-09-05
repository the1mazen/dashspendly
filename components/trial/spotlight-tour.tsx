'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrialMode } from '@/lib/trial-mode-context'
import { ChevronRight, ChevronLeft, X, Sparkles, Compass } from 'lucide-react'

interface RectPos {
  top: number
  left: number
  width: number
  height: number
}

export function SpotlightTour() {
  const {
    isTourActive,
    currentTour,
    currentTourStepIndex,
    nextTourStep,
    prevTourStep,
    skipCurrentTour,
  } = useTrialMode()

  const [targetRect, setTargetRect] = useState<RectPos | null>(null)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const rafIdRef = useRef<number | null>(null)

  const currentStep = currentTour?.steps[currentTourStepIndex]

  const updatePosition = useCallback(() => {
    if (!currentStep) return

    const el = document.querySelector(`[data-tour="${currentStep.targetId}"]`)
    if (el) {
      const rect = el.getBoundingClientRect()
      // Scroll element into view if not visible
      const isOutOfView =
        rect.top < 80 ||
        rect.bottom > window.innerHeight - 80 ||
        rect.left < 20 ||
        rect.right > window.innerWidth - 20

      if (isOutOfView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      }

      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    } else {
      // Fallback: centered
      setTargetRect(null)
    }
  }, [currentStep])

  useEffect(() => {
    if (!isTourActive || !currentStep) return

    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    const handleResizeOrScroll = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = requestAnimationFrame(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight })
        const el = document.querySelector(`[data-tour="${currentStep.targetId}"]`)
        if (el) {
          const rect = el.getBoundingClientRect()
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          })
        }
      })
    }

    // Initial position update after brief delay for modal / render transitions
    const timer = setTimeout(updatePosition, 100)

    window.addEventListener('resize', handleResizeOrScroll)
    window.addEventListener('scroll', handleResizeOrScroll, true)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResizeOrScroll)
      window.removeEventListener('scroll', handleResizeOrScroll, true)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [isTourActive, currentStep, updatePosition])

  if (!isTourActive || !currentTour || !currentStep) {
    return null
  }

  const isLastStep = currentTourStepIndex === currentTour.steps.length - 1
  const padding = 8

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {}
  const cardWidth = Math.min(360, windowSize.width - 32)
  const cardHeight = 220

  if (targetRect && windowSize.width > 0) {
    const placement = currentStep.placement || 'bottom'
    let top = 0
    let left = 0

    if (placement === 'bottom') {
      top = targetRect.top + targetRect.height + 16
      left = targetRect.left + targetRect.width / 2 - cardWidth / 2
    } else if (placement === 'top') {
      top = targetRect.top - cardHeight - 16
      left = targetRect.left + targetRect.width / 2 - cardWidth / 2
    } else if (placement === 'right') {
      top = targetRect.top + targetRect.height / 2 - cardHeight / 2
      left = targetRect.left + targetRect.width + 16
    } else if (placement === 'left') {
      top = targetRect.top + targetRect.height / 2 - cardHeight / 2
      left = targetRect.left - cardWidth - 16
    } else {
      // center
      top = windowSize.height / 2 - cardHeight / 2
      left = windowSize.width / 2 - cardWidth / 2
    }

    // Viewport boundaries clamping
    if (top < 16) top = 16
    if (top + cardHeight > windowSize.height - 16) {
      top = windowSize.height - cardHeight - 16
    }
    if (left < 16) left = 16
    if (left + cardWidth > windowSize.width - 16) {
      left = windowSize.width - cardWidth - 16
    }

    tooltipStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
    }
  } else {
    // Fallback centered
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${cardWidth}px`,
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] pointer-events-none select-none overflow-hidden">
        {/* SVG Mask Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-auto"
          style={{ width: '100vw', height: '100vh' }}
        >
          <defs>
            <mask id="spendly-tour-mask">
              {/* White background -> opaque overlay */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black cutout -> transparent spotlight */}
              {targetRect && (
                <rect
                  x={targetRect.left - padding}
                  y={targetRect.top - padding}
                  width={targetRect.width + padding * 2}
                  height={targetRect.height + padding * 2}
                  rx="14"
                  ry="14"
                  fill="black"
                />
              )}
            </mask>
          </defs>

          {/* Dark backdrop with mask */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(5, 7, 14, 0.78)"
            mask="url(#spendly-tour-mask)"
            className="backdrop-blur-[2px]"
          />
        </svg>

        {/* Highlight Glowing Ring around target */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="absolute pointer-events-none rounded-2xl border-2 border-primary/80 shadow-[0_0_25px_rgba(var(--primary-rgb,59,130,246),0.45)]"
            style={{
              top: targetRect.top - padding,
              left: targetRect.left - padding,
              width: targetRect.width + padding * 2,
              height: targetRect.height + padding * 2,
            }}
          />
        )}

        {/* Floating Tooltip Card */}
        <motion.div
          key={`${currentTour.pageId}-${currentTourStepIndex}`}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={tooltipStyle}
          className="pointer-events-auto bg-card/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/20 dark:border-zinc-700/60 shadow-2xl rounded-2xl p-5 text-card-foreground flex flex-col gap-3.5 z-[9999]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
                <Compass className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  {currentTour.title}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    Step {currentTourStepIndex + 1} of {currentTour.steps.length}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={skipCurrentTour}
              aria-label="Skip tour"
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/40 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <h4 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              {currentStep.title}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Progress dots & Footer actions */}
          <div className="flex items-center justify-between pt-1">
            {/* Step Indicators */}
            <div className="flex items-center gap-1.5">
              {currentTour.steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentTourStepIndex
                      ? 'w-5 bg-primary'
                      : idx < currentTourStepIndex
                      ? 'w-2 bg-primary/50'
                      : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {currentTourStepIndex > 0 && (
                <button
                  onClick={prevTourStep}
                  className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition flex items-center gap-1 border border-border/50"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              )}

              <button
                onClick={nextTourStep}
                className="px-4 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-md hover:shadow-primary/25 transition flex items-center gap-1"
              >
                {isLastStep ? 'Got it!' : 'Next'}
                {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
