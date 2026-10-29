import { create } from "zustand"

export type Theme = "auto" | "dark" | "light"
export type Accent = "blue" | "violet" | "aqua" | "rose" | "amber" | "emerald"
export type Fx = "full" | "lite"

interface Prefs { theme: Theme; accent: Accent; fx: Fx; haptics: boolean; compact: boolean }
const KEY = "ui_prefs_v2"
const DEFAULTS: Prefs = { theme: "auto", accent: "blue", fx: "full", haptics: true, compact: false }

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* storage may be blocked */ }
  // weak devices default to lite
  try {
    const mem = (navigator as any).deviceMemory
    const cores = navigator.hardwareConcurrency || 8
    if ((mem && mem <= 3) || cores <= 4) return { ...DEFAULTS, fx: "lite" }
  } catch { /* ignore */ }
  return DEFAULTS
}

function systemTheme(): "dark" | "light" {
  try {
    const tg = (window as any).Telegram?.WebApp?.colorScheme
    if (tg === "light" || tg === "dark") return tg
  } catch { /* ignore */ }
  try { return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark" } catch { return "dark" }
}

export function applyPrefs(p: Prefs) {
  const el = document.documentElement
  const t = p.theme === "auto" ? systemTheme() : p.theme
  el.setAttribute("data-theme", t)
  el.setAttribute("data-accent", p.accent)
  el.setAttribute("data-fx", p.fx)
  try {
    const bg = t === "light" ? "#eef1f7" : "#080a0f"
    const wa = (window as any).Telegram?.WebApp
    wa?.setHeaderColor?.(bg); wa?.setBackgroundColor?.(bg)
  } catch { /* ignore */ }
}

interface UiState extends Prefs { set: (patch: Partial<Prefs>) => void; reset: () => void }

export const useUiStore = create<UiState>((set, get) => ({
  ...load(),
  set: (patch) => {
    set(patch as any)
    const { theme, accent, fx, haptics, compact } = get()
    const p = { theme, accent, fx, haptics, compact }
    applyPrefs(p)
    try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ }
  },
  reset: () => { try { localStorage.removeItem(KEY) } catch { /* */ } set({ ...DEFAULTS } as any); applyPrefs(DEFAULTS) },
}))

export function bootUi() {
  const { theme, accent, fx, haptics, compact } = useUiStore.getState()
  applyPrefs({ theme, accent, fx, haptics, compact })
}
