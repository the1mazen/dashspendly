"use client"

import React, { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { getClientAuthUserId, clearClientAuthSession, setClientAuthSession } from "@/lib/auth-session"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    let isMounted = true

    const verifyAuth = async () => {
      // 1. Check local session
      const localUserId = getClientAuthUserId()

      // 2. If Supabase is configured, verify active session
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user?.id) {
            setClientAuthSession(session.user.id)
            if (isMounted) setIsAuthenticated(true)
            return
          } else {
            // Supabase is configured but no session returned
            if (!localUserId) {
              clearClientAuthSession()
              if (isMounted) {
                setIsAuthenticated(false)
                const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : ""
                router.replace(`/login${redirectParam}`)
              }
              return
            }
          }
        } catch (err) {
          console.warn("Auth check error:", err)
        }
      }

      // 3. If localUserId exists, allow; otherwise redirect
      if (localUserId) {
        setClientAuthSession(localUserId)
        if (isMounted) setIsAuthenticated(true)
      } else {
        clearClientAuthSession()
        if (isMounted) {
          setIsAuthenticated(false)
          const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : ""
          router.replace(`/login${redirectParam}`)
        }
      }
    }

    verifyAuth()

    // Listen to Supabase auth changes
    let authSub: any = null
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") {
          clearClientAuthSession()
          if (isMounted) {
            setIsAuthenticated(false)
            router.replace("/login")
          }
        } else if (session?.user?.id) {
          setClientAuthSession(session.user.id)
          if (isMounted) setIsAuthenticated(true)
        }
      })
      authSub = data?.subscription
    }

    return () => {
      isMounted = false
      authSub?.unsubscribe?.()
    }
  }, [router, pathname])

  // While verifying, or if not authorized, render sleek loading gate
  if (isAuthenticated !== true) {
    return (
      <div className="min-h-screen bg-[#00042e] flex flex-col items-center justify-center gap-4 text-white font-sans selection:bg-[#5EEAD4] selection:text-[#120824]">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/LOGO.png"
            alt="Spendly"
            className="h-10 w-auto object-contain select-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
          />
          <div className="size-6 rounded-full border-2 border-[#5b4dc7] border-t-transparent animate-spin mt-2" />
          <p className="text-xs text-white/50 tracking-wide font-medium">Verifying authorization...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
