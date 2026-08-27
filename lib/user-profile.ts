"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, isSupabaseConfigured } from "./supabase"

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
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const meta = user.user_metadata || {}
          const firstName = meta.first_name || meta.firstName || ""
          const lastName = meta.last_name || meta.lastName || ""
          const fullName = meta.full_name || meta.fullName || (firstName && lastName ? `${firstName} ${lastName}` : firstName || user.email?.split("@")[0] || "User")
          const username = meta.user_name || meta.username || `@${user.email?.split("@")[0] || "user"}`
          const currency = meta.currency || meta.default_currency || "USD"

          const supaProfile: UserProfile = {
            fullName,
            username: username.startsWith("@") ? username : `@${username}`,
            email: user.email || "",
            currency,
            phone: user.phone || meta.phone || "+1 (555) 019-2834",
            language: meta.language || "English (US)",
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
        await supabase.auth.updateUser({
          data: {
            full_name: updated.fullName,
            username: updated.username,
            currency: updated.currency,
            language: updated.language,
          },
        })
      } catch (err) {
        console.warn("Error updating Supabase user metadata:", err)
      }
    }
    return updated
  }, [])

  return {
    profile,
    loading,
    initials: getInitials(profile.fullName || profile.username),
    updateProfile,
    refreshProfile: fetchProfile,
  }
}
