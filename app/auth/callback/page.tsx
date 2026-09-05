"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const handleCallback = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href)
            const code = url.searchParams.get("code")

            if (code) {
              await supabase.auth.exchangeCodeForSession(code)
            }
          }

          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            if (typeof window !== "undefined") {
              localStorage.setItem("spendly_auth_user_id", session.user.id)
              const maxAge = 60 * 60 * 24 * 30
              document.cookie = `spendly_session=${encodeURIComponent(session.user.id)}; path=/; max-age=${maxAge}; SameSite=Lax`
            }

            const user = session.user
            const meta = user.user_metadata || {}
            const cleanUsername = meta.user_name || meta.username || user.email?.split("@")[0] || "user"
            const fullName = meta.full_name || meta.name || user.email?.split("@")[0] || "User"
            try {
              await supabase.from("profiles").upsert({
                id: user.id,
                username: cleanUsername,
                full_name: fullName,
                default_currency: "USD",
              })
            } catch {
              // Ignore
            }

            if (isMounted) {
              router.replace("/dashboard")
            }
            return
          }
        } catch (err) {
          console.warn("OAuth callback processing error:", err)
        }
      }

      if (isMounted) {
        router.replace("/login")
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
      <p className="text-xs text-white/50 font-sans">Completing sign-in...</p>
    </div>
  )
}
