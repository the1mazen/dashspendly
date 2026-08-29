"use client"

import type React from "react"
import { motion, type HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"

const animationProps: HTMLMotionProps<"button"> = {
  initial: { "--x": "100%", scale: 0.8 } as any,
  animate: { "--x": "-100%", scale: 1 } as any,
  whileTap: { scale: 0.95 },
  transition: {
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "loop",
    repeatDelay: 1,
    type: "spring",
    stiffness: 20,
    damping: 15,
    mass: 2,
    scale: {
      type: "spring",
      stiffness: 200,
      damping: 5,
      mass: 0.5,
    },
  },
}

interface ShinyButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode
  className?: string
}

export const ShinyButton: React.FC<ShinyButtonProps> = ({ children, className, ...props }) => {
  return (
    <motion.button
      {...animationProps}
      {...props}
      className={cn(
        "relative rounded-lg px-8 py-4 uppercase tracking-wide overflow-hidden font-open-sans-custom text-xs scale-90",
        "bg-white/20 backdrop-blur-sm border-2 border-white/30",
        "shadow-[0_0_30px_rgba(255,255,255,0.4),inset_0_0_20px_rgba(255,255,255,0.1)]",
        "hover:shadow-[0_0_50px_rgba(255,255,255,0.6),inset_0_0_30px_rgba(255,255,255,0.2)]",
        "transition-all duration-300",
        className,
      )}
    >
      <span className="relative z-10 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{children}</span>

      <span
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
          transform: "translateX(var(--x))",
        }}
      />
    </motion.button>
  )
}
