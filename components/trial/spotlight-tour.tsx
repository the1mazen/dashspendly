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
            className="absolute pointer-events-none rounded-2xl border-2 border-[#5EEAD4] shadow-[0_0_25px_rgba(94,234,212,0.45)]"
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
          style={{
            ...tooltipStyle,
            background: 'linear-gradient(135deg, rgba(32, 12, 62, 0.95) 0%, rgba(18, 48, 38, 0.92) 50%, rgba(42, 48, 16, 0.92) 100%)',
            borderColor: 'rgba(255, 255, 255, 0.16)',
            boxShadow: '0 20px 50px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
          }}
          className="pointer-events-auto backdrop-blur-2xl border rounded-3xl p-5 text-white flex flex-col gap-3.5 z-[9999]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-white/10 flex items-center justify-center text-[#FEF08A]">
                <Compass className="size-3.5 animate-spin-slow" />
              </div>
              <div>
                <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/60 font-sans">
                  {currentTour.title}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#5EEAD4]/20 text-[#5EEAD4]">
                    Step {currentTourStepIndex + 1} of {currentTour.steps.length}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={skipCurrentTour}
              aria-label="Skip tour"
              className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-1">
            <h4 className="text-sm font-bold font-display text-white flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-[#FEF08A] shrink-0" />
              {currentStep.title}
            </h4>
            <p className="text-xs text-white/70 font-sans leading-relaxed">
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
                      ? 'w-5 bg-[#5EEAD4]'
                      : idx < currentTourStepIndex
                      ? 'w-2 bg-[#34D399]'
                      : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {currentTourStepIndex > 0 && (
                <button
                  onClick={prevTourStep}
                  className="px-2.5 py-1 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center gap-1 border border-white/10 cursor-pointer"
                >
                  <ChevronLeft className="size-3" />
                  Back
                </button>
              )}

              <button
                onClick={nextTourStep}
                className="px-3.5 py-1 text-xs font-bold text-[#120824] rounded-xl shadow-md transition flex items-center gap-1 cursor-pointer hover:scale-[1.02]"
                style={{ background: 'linear-gradient(90deg, #5EEAD4 0%, #A7F3D0 40%, #FEF08A 100%)' }}
              >
                <span>{isLastStep ? 'Got it!' : 'Next'}</span>
                {!isLastStep && <ChevronRight className="size-3" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
