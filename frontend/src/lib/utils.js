import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// The API serialises naive UTC datetimes, so parsing needs the helpers in
// `hrms.js`. That module never imports this one, so there is no cycle.
import { parseCalendarDay, parseInstant } from "./hrms"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** "Infamous Wolverine" -> "IW". Used for avatar fallbacks. */
export function initials(name) {
  if (!name) return "?"
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** First name only, for greetings. */
export function firstName(name) {
  if (!name) return "there"
  return String(name).trim().split(/\s+/)[0]
}

/**
 * Pull a readable message out of an axios error. FastAPI returns `detail` as
 * either a string or a list of validation objects, so both shapes are handled.
 */
export function errorMessage(error, fallback = "Something went wrong. Please try again.") {
  const detail = error?.response?.data?.detail

  if (typeof detail === "string") return detail

  if (Array.isArray(detail)) {
    const first = detail[0]
    if (first?.msg) {
      // Strip pydantic's "Value error, " prefix for a cleaner message.
      const msg = String(first.msg).replace(/^Value error,\s*/i, "")
      const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : null
      return field && field !== "body" ? `${labelize(field)}: ${msg}` : msg
    }
  }

  if (error?.message === "Network Error") {
    return "Cannot reach the server. Is the backend running on port 8000?"
  }

  return error?.message || fallback
}

/** "email_id" -> "Email id" */
export function labelize(key) {
  return String(key).replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
}

/**
 * Password rules mirrored from the backend validators in
 * `backend/app/schemas/user.py` so the UI never lets through something the
 * API will reject.
 */
export const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "digit", label: "One number", test: (v) => /\d/.test(v) },
]

export function passwordStrength(value = "") {
  const passed = passwordRules.filter((r) => r.test(value)).length
  // A bonus point for length or symbols pushes a valid password to "Strong".
  const bonus = value.length >= 12 || /[^A-Za-z0-9]/.test(value) ? 1 : 0
  const score = passed === 0 ? 0 : Math.min(passed + bonus, 5)

  const labels = ["", "Very weak", "Weak", "Fair", "Good", "Strong"]
  return {
    score,
    passed,
    valid: passed === passwordRules.length,
    label: labels[score] || "",
    percent: (score / 5) * 100,
  }
}

/** Copy text to the clipboard, falling back for non-secure contexts. */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export function formatDate(value) {
  const d = parseCalendarDay(value)
  if (!d) return "—"
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

/** "3 minutes ago" style stamps for the recent-activity list. */
export function relativeTime(value) {
  const date = parseInstant(value)
  if (!date) return ""

  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]

  for (const [unit, secs] of units) {
    if (Math.abs(seconds) >= secs) {
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
      return rtf.format(-Math.round(seconds / secs), unit)
    }
  }
  return "just now"
}
