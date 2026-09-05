export const SPENDLY_SESSION_COOKIE = "spendly_session"
export const SPENDLY_AUTH_USER_KEY = "spendly_auth_user_id"

export function setClientAuthSession(userId: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SPENDLY_AUTH_USER_KEY, userId)
    // 30 days max-age
    const maxAge = 60 * 60 * 24 * 30
    document.cookie = `${SPENDLY_SESSION_COOKIE}=${encodeURIComponent(userId)}; path=/; max-age=${maxAge}; SameSite=Lax`
  } catch (err) {
    console.warn("Failed to set auth session:", err)
  }
}

export function clearClientAuthSession() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(SPENDLY_AUTH_USER_KEY)
    document.cookie = `${SPENDLY_SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
  } catch (err) {
    console.warn("Failed to clear auth session:", err)
  }
}

export function getClientAuthUserId(): string | null {
  if (typeof window === "undefined") return null
  try {
    const localId = localStorage.getItem(SPENDLY_AUTH_USER_KEY)
    if (localId && localId.trim()) return localId.trim()

    // Fallback: check cookie
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${SPENDLY_SESSION_COOKIE}=`))
    if (match) {
      const val = decodeURIComponent(match.split("=")[1] || "")
      if (val && val.trim()) return val.trim()
    }
  } catch {
    // Ignore
  }
  return null
}
