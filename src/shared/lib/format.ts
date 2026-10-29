/** Shared formatting helpers (Persian-friendly). */
const FA = "۰۱۲۳۴۵۶۷۸۹"
export const faDigits = (v: string | number) => String(v).replace(/\d/g, (d) => FA[+d])
export const num = (n: number | null | undefined, digits = 0) =>
  n == null || Number.isNaN(n) ? "—" : faDigits(Number(n).toLocaleString("en-US", { maximumFractionDigits: digits }))
export const toman = (n: number | null | undefined) => (n == null ? "—" : `${num(n)} تومان`)

export function formatBytes(bytes: number | null | undefined, unlimitedLabel = "نامحدود"): string {
  if (bytes == null) return "—"
  if (bytes <= 0) return bytes === 0 ? "۰" : unlimitedLabel
  const units = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت", "ترابایت"]
  let i = 0, v = bytes
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${faDigits(v >= 100 || i === 0 ? Math.round(v) : v.toFixed(v >= 10 ? 1 : 2).replace(/\.0+$/, ""))} ${units[i]}`
}

const jfmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { timeZone: "Asia/Tehran", ...opts })
export function jalaliDate(input: number | string | Date | null | undefined, withTime = false): string {
  if (input == null || input === "") return "—"
  let d: Date
  if (typeof input === "number") d = new Date(input < 1e12 ? input * 1000 : input)
  else if (input instanceof Date) d = input
  else {
    const s = String(input)
    d = new Date(/^\d{4}-\d{2}-\d{2}[ T]/.test(s) && !/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s.replace(" ", "T") + "Z" : s)
  }
  if (Number.isNaN(d.getTime())) return String(input)
  const date = jfmt({ year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
  const out = faDigits(date.replace(/‏/g, ""))
  if (!withTime) return out
  return `${out} ${faDigits(jfmt({ hour: "2-digit", minute: "2-digit", hour12: false }).format(d))}`
}

export function timeAgo(input: number | string | null | undefined): string {
  if (input == null || input === "") return "—"
  const ts = typeof input === "number" ? (input < 1e12 ? input * 1000 : input) : new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(String(input)) ? String(input) : String(input).replace(" ", "T") + "Z").getTime()
  if (!ts || Number.isNaN(ts)) return "—"
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (s < 45) return "همین الان"
  if (s < 3600) return `${faDigits(Math.floor(s / 60) || 1)} دقیقه پیش`
  if (s < 86400) return `${faDigits(Math.floor(s / 3600))} ساعت پیش`
  if (s < 86400 * 30) return `${faDigits(Math.floor(s / 86400))} روز پیش`
  return jalaliDate(ts)
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** "اسم سرویس در پنل | اسم بسته" */
export function serviceTitle(s: { service_name?: string | null; package_name?: string | null; plan?: string | null; title?: string | null }): string {
  if (s.title) return s.title
  const a = (s.service_name || "").trim(), b = (s.package_name || s.plan || "").trim()
  return a && b ? `${a} | ${b}` : a || b || "سرویس"
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true } catch { /* fallback */ }
  try {
    const ta = document.createElement("textarea")
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"
    document.body.appendChild(ta); ta.select()
    const ok = document.execCommand("copy"); ta.remove(); return ok
  } catch { return false }
}
