"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Plus, Trash2, ArrowRight } from "lucide-react"
import { saveLocalUserProfile } from "@/lib/user-profile"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export default function AuthPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [setupStep, setSetupStep] = useState<"auth" | "account" | "dashboard">("auth")
  const [accountCount, setAccountCount] = useState(1)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleModeSwitch = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setIsSignUp(!isSignUp)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 50)
    }, 150)
  }

  if (setupStep === "account") {
    const accountFields = (index: number) => (
      <div key={index} className="space-y-3 rounded-2xl border border-white/5 p-3 transition-all duration-300">
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-xs font-medium">Account {index + 1}</span>
          {accountCount > 1 && (
            <button
              type="button"
              aria-label={`Remove account ${index + 1}`}
              onClick={() => setAccountCount((count) => count - 1)}
              className="text-white/30 hover:text-red-300 transition-colors duration-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder="Account name"
          required
          className="w-full bg-[#1a1a26] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5b4dc7]/50 focus:ring-1 focus:ring-[#5b4dc7]/20 transition-all duration-300"
        />
        <select
          defaultValue=""
          required
          aria-label={`Account ${index + 1} type`}
          className="w-full bg-[#1a1a26] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5b4dc7]/50 focus:ring-1 focus:ring-[#5b4dc7]/20 transition-all duration-300 appearance-none"
        >
          <option value="" disabled>Account type</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="card">Card</option>
          <option value="savings">Savings</option>
        </select>
        <input
          type="number"
          placeholder="Starting balance"
          required
          step="0.01"
          className="w-full bg-[#1a1a26] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5b4dc7]/50 focus:ring-1 focus:ring-[#5b4dc7]/20 transition-all duration-300"
        />
      </div>
    )

    return (
      <div className="min-h-screen bg-[#00042e] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#12121a] rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
          <div className="p-6 lg:p-8">
            <h1 className="font-serif text-white text-2xl lg:text-3xl font-bold mb-1 tracking-tight">Add your first account</h1>
            <p className="text-white/40 text-sm mb-6">Set up one or more accounts to start tracking your finances.</p>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); setSetupStep("dashboard") }}>
              {Array.from({ length: accountCount }, (_, index) => accountFields(index))}
              <button
                type="button"
                onClick={() => setAccountCount((count) => count + 1)}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-[#5b4dc7]/50 text-[#5b4dc7] hover:bg-[#5b4dc7]/10 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add another account
              </button>
              <button
                type="submit"
                className="w-full bg-[#5b4dc7] hover:bg-[#5b4dc7]/90 text-white font-medium py-2.5 rounded-xl transition-all duration-300 text-sm shadow-lg shadow-[#5b4dc7]/25 hover:shadow-[#5b4dc7]/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-[#5b4dc7]/20"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (setupStep === "dashboard") {
    return (
      <div className="min-h-screen bg-[#00042e] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#12121a] rounded-3xl p-8 text-center shadow-2xl shadow-black/50">
          <h1 className="font-serif text-white text-2xl font-bold">Your dashboard</h1>
          <p className="text-white/40 text-sm mt-2 mb-6">Your account is ready to go.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full bg-[#5b4dc7] hover:bg-[#5b4dc7]/90 text-white font-medium py-2.5 rounded-xl transition-all duration-300 text-sm shadow-lg shadow-[#5b4dc7]/25 hover:shadow-[#5b4dc7]/40 hover:-translate-y-0.5"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#00042e] flex items-center justify-center p-4">
      <div 
        className={`w-full max-w-md bg-[#12121a] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Sign-up / Login Form */}
        <div className="p-6 lg:p-8 flex flex-col justify-center bg-transparent">
          <div className={`transition-all duration-300 ease-out ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
            <h1 
              className={`font-serif text-white text-2xl lg:text-3xl font-bold mb-1 tracking-tight transition-all duration-500 delay-300 ${
                mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              {isSignUp ? "Create an account" : "Welcome back"}
            </h1>
            <p 
              className={`text-white/40 text-sm mb-6 transition-all duration-500 delay-[350ms] ${
                mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={handleModeSwitch}
                className="text-white/80 underline underline-offset-2 hover:text-[#5b4dc7] transition-colors duration-300 cursor-pointer"
              >
                {isSignUp ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>

          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault()
              setLoading(true)
              setAuthError("")

              const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || (email ? email.split("@")[0] : "Spendly User")
              const userHandle = username ? (username.startsWith("@") ? username : `@${username}`) : (email ? `@${email.split("@")[0]}` : "@user")

              saveLocalUserProfile({
                fullName,
                username: userHandle,
                email: email || "user@spendly.app",
                currency: currency || "USD",
              })

              if (isSupabaseConfigured && supabase && email && password) {
                try {
                  if (isSignUp) {
                    await supabase.auth.signUp({
                      email,
                      password,
                      options: {
                        data: {
                          first_name: firstName,
                          last_name: lastName,
                          full_name: fullName,
                          username: userHandle,
                          currency,
                        },
                      },
                    })
                  } else {
                    await supabase.auth.signInWithPassword({
                      email,
                      password,
                    })
                  }
                } catch (err: any) {
                  console.warn("Supabase auth error:", err)
                }
              }

              setLoading(false)
              if (isSignUp) {
                setSetupStep("account")
              } else {
                router.push("/dashboard")
              }
            }}
          >
            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-sans">
                {authError}
              </div>
            )}

            {/* Name Fields - Animated Height */}
            <div 
              className={`grid transition-all duration-400 ease-out overflow-hidden ${
                isSignUp ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div 
                  className={`grid grid-cols-2 gap-3 pb-3 transition-all duration-500 delay-[400ms] ${
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#1a1a26] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5b4dc7]/50 focus:ring-1 focus:ring-[#5b4dc7]/20 transition-all duration-300 font-sans"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#1a1a26] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5b4dc7]/50 focus:ring-1 focus:ring-[#5b4dc7]/20 transition-all duration-300 font-sans"
                  />
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Username (e.g. @mazen)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#1a1a26] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5b4dc7]/50 focus:ring-1 focus:ring-[#5b4dc7]/20 transition-all duration-300 font-sans"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      aria-label="Default currency"
                      className="w-full bg-[#1a1a26] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5b4dc7]/50 focus:ring-1 focus:ring-[#5b4dc7]/20 transition-all duration-300 appearance-none cursor-pointer font-sans"
                    >
                      <option value="USD">Default currency: USD ($)</option>
                      <option value="EGP">Default currency: EGP (EGP)</option>
                      <option value="EUR">Default currency: EUR (€)</option>
                      <option value="GBP">Default currency: GBP (£)</option>
                      <option value="AED">Default currency: AED (AED)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`transition-all duration-500 delay-[450ms] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1a1a26] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5b4dc7]/50 focus:ring-1 focus:ring-[#5b4dc7]/20 transition-all duration-300 font-sans"
              />
            </div>

            <div 
              className={`relative transition-all duration-500 delay-[500ms] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a1a26] border border-white/5 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5b4dc7]/50 focus:ring-1 focus:ring-[#5b4dc7]/20 transition-all duration-300 font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors duration-300 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Terms Checkbox - Animated */}
            <div 
              className={`grid transition-all duration-400 ease-out overflow-hidden ${
                isSignUp ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <label 
                  className={`flex items-center gap-2.5 cursor-pointer py-1 transition-all duration-500 delay-[550ms] ${
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-300 ${
                        agreedToTerms
                          ? "bg-[#5b4dc7] shadow-lg shadow-[#5b4dc7]/30"
                          : "border border-white/20 bg-transparent"
                      }`}
                    >
                      <svg
                        className={`w-2.5 h-2.5 text-white transition-all duration-300 ${
                          agreedToTerms ? "opacity-100 scale-100" : "opacity-0 scale-50"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <span className="text-white/40 text-xs">
                    I agree to the{" "}
                    <a href="#" className="text-[#5b4dc7] underline underline-offset-2 hover:text-[#5b4dc7]/80 transition-colors duration-300">
                      Terms & Conditions
                    </a>
                  </span>
                </label>
              </div>
            </div>

            <div
              className={`transition-all duration-500 delay-[600ms] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <button
                type="submit"
                className="w-full bg-[#5b4dc7] hover:bg-[#5b4dc7]/90 text-white font-medium py-2.5 rounded-xl transition-all duration-300 text-sm shadow-lg shadow-[#5b4dc7]/25 hover:shadow-[#5b4dc7]/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-[#5b4dc7]/20 cursor-pointer"
              >
                <span className={`inline-block transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
                  {isSignUp ? "Create account" : "Sign in"}
                </span>
              </button>
            </div>
          </form>

          {/* Divider */}
          <div 
            className={`flex items-center gap-3 my-5 transition-all duration-500 delay-[650ms] ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className={`text-white/30 text-xs transition-all duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
              {isSignUp ? "Or register with" : "Or sign in with"}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Social Buttons */}
          <div 
            className={`grid grid-cols-2 gap-3 transition-all duration-500 delay-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex items-center justify-center gap-2 bg-[#1a1a26] border border-white/5 hover:border-white/20 hover:bg-[#1f1f2a] text-white text-sm py-2.5 rounded-xl transition-all duration-300 group hover:scale-[1.02] active:scale-100 cursor-pointer"
            >
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-white/80 group-hover:text-white transition-colors duration-300">Google</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex items-center justify-center gap-2 bg-[#1a1a26] border border-white/5 hover:border-white/20 hover:bg-[#1f1f2a] text-white text-sm py-2.5 rounded-xl transition-all duration-300 group hover:scale-[1.02] active:scale-100 cursor-pointer"
            >
              <svg className="w-4 h-4 text-white/80 group-hover:text-white transition-all duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span className="text-white/80 group-hover:text-white transition-colors duration-300">Apple</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
