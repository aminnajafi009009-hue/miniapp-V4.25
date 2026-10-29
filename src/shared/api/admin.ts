import { create } from "zustand"
import { apiGet, apiPost, apiPostForm } from "./client"

/** Thin helpers for /api/admin/* and /api/reseller/* */
export const adminGet = <T = any>(path: string): Promise<T> => apiGet(`/api/admin${path}`)
export const adminPost = <T = any>(path: string, body?: unknown): Promise<T> => apiPost(`/api/admin${path}`, body)
export const adminForm = <T = any>(path: string, form: FormData): Promise<T> => apiPostForm(`/api/admin${path}`, form)
export const resellerGet = <T = any>(path: string): Promise<T> => apiGet(`/api/reseller${path}`)
export const resellerPost = <T = any>(path: string, body?: unknown): Promise<T> => apiPost(`/api/reseller${path}`, body)

/** query-string helper: qs({a:1,b:""}) -> "?a=1" */
export const qs = (o: Record<string, string | number | boolean | null | undefined>) => {
  const p = Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  return p.length ? `?${p.join("&")}` : ""
}

export type AdminSection =
  | "stats" | "requests" | "receipts" | "users" | "broadcast" | "discounts" | "agency" | "plans"
  | "vpn_panel" | "referrals" | "botinfo" | "orders_toggle" | "settings" | "logs" | "health" | "tickets" | "guides"

export interface AdminMe { name: string; is_main: boolean; sections: AdminSection[] }

interface AdminState { me: AdminMe | null; loading: boolean; failed: boolean; load: () => Promise<void>; can: (s: AdminSection) => boolean }
export const useAdminStore = create<AdminState>((set, get) => ({
  me: null, loading: false, failed: false,
  load: async () => {
    if (get().me || get().loading) return
    set({ loading: true, failed: false })
    // a transient failure must never be mistaken for "no permissions": retry, then surface an error
    for (let i = 0; i < 3; i++) {
      try { set({ me: await adminGet<AdminMe>("/me"), loading: false, failed: false }); return } catch { await new Promise((r) => setTimeout(r, 700 * (i + 1))) }
    }
    set({ loading: false, failed: true })
  },
  can: (s) => { const m = get().me; return !!m && (m.is_main || m.sections.includes(s)) },
}))
