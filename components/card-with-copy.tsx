"use client"

import React, { useState, useCallback } from "react"
import { Copy, Check, ExternalLink } from "lucide-react"
import Link from "next/link"

const CARD_SHADOW =
  "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px"

interface CardWithCopyProps {
  cardName: string
  children: React.ReactNode
}

export function CardWithCopy({ cardName, children }: CardWithCopyProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      const url = `${window.location.origin}/preview/${cardName}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: noop
    }
  }, [cardName])

  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
      <div className="flex items-center justify-between bg-secondary/80 px-4 py-2 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">{cardName}</span>
        <div className="flex items-center gap-2">
          <Link
            href={`/preview/${cardName}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <ExternalLink className="size-3" />
            <span>Preview</span>
          </Link>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
            aria-label="Copy link"
          >
            {copied ? <Check className="size-3 text-fin-gain" /> : <Copy className="size-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
      <div className="w-full">{children}</div>
    </div>
  )
}
