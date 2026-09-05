"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { setClientAuthSession } from "@/lib/auth-session"
import { saveLocalUserProfile } from "@/lib/user-profile"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [statusMessage, setStatusMessage] = useState("Completing sign-in...")
  const handledRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const finalizeAuth = async (user: any) => {
      if (handledRef.current) return
      handledRef.current = true

      try {
        setClientAuthSession(user.id)

        const meta = user.user_metadata || {}
        const cleanUsername = meta.user_name || meta.username || user.email?.split("@")[0] || "user"
        const fullName = meta.full_name || meta.name || user.email?.split("@")[0] || "User"
        const email = user.email || ""

        saveLocalUserProfile({
          fullName,
          username: cleanUsername.startsWith("@") ? cleanUsername : `@${cleanUsername}`,
          email,
          currency: "USD",
        })

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from("profiles").upsert({
              id: user.id,
              username: cleanUsername.replace(/^@/, ""),
              full_name: fullName,
              default_currency: "USD",
            })
          } catch (pErr) {
            console.warn("Profile upsert notice:", pErr)
          }
        }

        if (isMounted) {
          router.replace("/dashboard")
        }
      } catch (err) {
        console.error("Failed finalizing auth session:", err)
        if (isMounted) {
          router.replace("/login?error=" + encodeURIComponent("Failed initializing profile. Please try again."))
        }
      }
    }

    const handleCallback = async () => {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        const error = url.searchParams.get("error") || url.searchParams.get("error_description")
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error)}`)
          return
        }

        const code = url.searchParams.get("code")

        if (isSupabaseConfigured && supabase) {
          // Listen to auth state changes in case exchange completes in background
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              await finalizeAuth(session.user)
            }
          })

          if (code) {
            try {
              setStatusMessage("Exchanging authorization code...")
              const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
              if (exchangeError) {
                console.warn("exchangeCodeForSession warning:", exchangeError.message)
              } else if (data?.session?.user) {
                await finalizeAuth(data.session.user)
                return
              }
            } catch (exchangeErr) {
              console.warn("exchangeCodeForSession exception:", exchangeErr)
            }
          }

          // Polling attempts to retrieve hydrated session
          for (let attempt = 0; attempt < 6; attempt++) {
            if (handledRef.current) return
            try {
              const { data: { session } } = await supabase.auth.getSession()
              if (session?.user) {
                await finalizeAuth(session.user)
                return
              }

              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                await finalizeAuth(user)
                return
              }
            } catch {
              // Ignore interim fetch errors
            }

            // Wait 350ms before next attempt
            await new Promise((res) => setTimeout(res, 350))
          }

          // Unsubscribe if still waiting
          authListener?.subscription?.unsubscribe?.()
        }
      }

      // If after all attempts no session was established
      if (isMounted && !handledRef.current) {
        router.replace("/login?error=" + encodeURIComponent("Could not complete authentication. Please sign in again."))
      }
    }

    handleCallback()

    return () => {
      isMounted = false
    }
  }, [router])

  return (
    <div className="w-full min-h-screen bg-[#00042e] flex flex-col items-center justify-center gap-4 text-white">
      <div className="size-8 rounded-full border-2 border-[#5b4dc7] border-t-transparent animate-spin" />
      <p className="text-xs text-white/60 font-sans">{statusMessage}</p>
    </div>
  )
}
