"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, isSupabaseConfigured, resolveCurrentUserId } from "./supabase"

export interface UserProfile {
  fullName: string
  username: string
  email: string
  currency: string
  phone?: string
  language?: string
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  fullName: "Mazen",
  username: "@mazen",
  email: "mazen@spendly.app",
  currency: "USD",
  phone: "+1 (555) 019-2834",
  language: "English (US)",
}

const STORAGE_KEY = "spendly_user_profile"
const PROFILE_UPDATED_EVENT = "spendly_profile_updated"

export function getInitials(name: string): string {
  if (!name) return "SP"
  const clean = name.replace(/^@/, "").trim()
  const parts = clean.split(/\s+/)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase()
}

export function getLocalUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) }
    }
  } catch {
    // Ignore JSON errors
  }
  return DEFAULT_USER_PROFILE
}

export function resetLocalUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: DEFAULT_USER_PROFILE }))
  } catch {
    // Ignore error
  }
  return DEFAULT_USER_PROFILE
}

export function saveLocalUserProfile(profile: Partial<UserProfile>): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE
  try {
    const current = getLocalUserProfile()
    const updated = { ...current, ...profile }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: updated }))
    return updated
  } catch {
    return DEFAULT_USER_PROFILE
  }
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    // 1. If Supabase is configured, check authenticated user
    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId) {
          let dbProfile: any = null
          try {
            const { data } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .maybeSingle()
            dbProfile = data
          } catch {
            // Ignore if table query fails
          }

          let userMeta: any = {}
          let userEmail: string = ""
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              userMeta = user.user_metadata || {}
              userEmail = user.email || ""
            }
          } catch {
            // Ignore
          }

          const firstName = dbProfile?.first_name || userMeta.first_name || userMeta.firstName || ""
          const lastName = dbProfile?.last_name || userMeta.last_name || userMeta.lastName || ""
          const fullName = dbProfile?.full_name || userMeta.full_name || userMeta.fullName || (firstName && lastName ? `${firstName} ${lastName}` : firstName || userEmail.split("@")[0] || "User")
          const rawUsername = dbProfile?.username || userMeta.username || userMeta.user_name || userEmail.split("@")[0] || "user"
          const username = rawUsername.startsWith("@") ? rawUsername : `@${rawUsername}`
          const currency = dbProfile?.default_currency || dbProfile?.currency || userMeta.default_currency || userMeta.currency || "USD"

          const supaProfile: UserProfile = {
            fullName,
            username,
            email: userEmail || dbProfile?.email || "",
            currency,
            phone: dbProfile?.phone || userMeta.phone || "+1 (555) 019-2834",
            language: dbProfile?.language || userMeta.language || "English (US)",
          }
          setProfile(supaProfile)
          saveLocalUserProfile(supaProfile)
          setLoading(false)
          return
        }
      } catch (err) {
        console.warn("Supabase profile fetch error:", err)
      }
    }

    // 2. Fall back to local storage profile
    const local = getLocalUserProfile()
    setProfile(local)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfile()

    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfile>
      if (customEvent.detail) {
        setProfile(customEvent.detail)
      } else {
        fetchProfile()
      }
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate)
    window.addEventListener("storage", handleProfileUpdate)

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate)
      window.removeEventListener("storage", handleProfileUpdate)
    }
  }, [fetchProfile])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const updated = saveLocalUserProfile(updates)
    setProfile(updated)

    if (isSupabaseConfigured && supabase) {
      try {
        const cleanUser = updated.username ? updated.username.replace(/^@/, "") : ""
        await supabase.auth.updateUser({
          data: {
            full_name: updated.fullName,
            username: cleanUser,
            currency: updated.currency,
            default_currency: updated.currency,
            language: updated.language,
          },
        })

        const userId = await resolveCurrentUserId()
        if (userId) {
          await supabase.from("profiles").upsert({
            id: userId,
            full_name: updated.fullName,
            username: cleanUser,
            default_currency: updated.currency,
            language: updated.language,
            phone: updated.phone,
          })
        }
      } catch (err) {
        console.warn("Error updating Supabase user metadata:", err)
      }
    }
    return updated
  }, [])

  const resetProfile = useCallback(async () => {
    const fresh = resetLocalUserProfile()
    setProfile(fresh)
  }, [])

  return {
    profile,
    loading,
    initials: getInitials(profile.fullName || profile.username),
    updateProfile,
    resetProfile,
    refreshProfile: fetchProfile,
  }
}
