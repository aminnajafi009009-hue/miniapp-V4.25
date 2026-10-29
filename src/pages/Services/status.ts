import type { ServiceStatus } from "@/shared/api/types"
import { faDigits } from "@/shared/lib/format"

export const STATUS_META: Record<string, { label: string; tone: "ok" | "warn" | "bad" | "info" | undefined }> = {
  active: { label: "فعال", tone: "ok" },
  on_hold: { label: "در انتظار اتصال", tone: "info" },
  limited: { label: "حجم تمام شده", tone: "warn" },
  expired: { label: "منقضی", tone: "bad" },
  disabled: { label: "غیرفعال", tone: "bad" },
}
export const statusMeta = (s?: ServiceStatus) => STATUS_META[s || ""] ?? { label: "نامشخص", tone: undefined }

export const isOnline = (ts?: number | null) => {
  if (!ts) return false
  const ms = ts < 1e12 ? ts * 1000 : ts
  return Date.now() - ms < 5 * 60 * 1000
}

/** true when service needs attention: close to expiry or traffic nearly gone */
export function isExpiring(s: { status?: ServiceStatus; remaining_days?: number | null; usage?: { percent: number | null } }) {
  if (s.status && s.status !== "active" && s.status !== "on_hold") return false
  const d = s.remaining_days
  const p = s.usage?.percent
  return (d != null && d >= 0 && d <= 5) || (p != null && p >= 85)
}
export const isInactive = (s: { status?: ServiceStatus }) => !!s.status && s.status !== "active" && s.status !== "on_hold"

export function daysLabel(d: number | null | undefined): string {
  if (d == null) return "—"
  if (d < 0) return "منقضی"
  return d === 0 ? "کمتر از یک روز" : `${faDigits(d)} روز`
}
