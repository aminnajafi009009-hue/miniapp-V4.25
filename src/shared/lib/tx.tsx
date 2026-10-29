import type { ReactNode } from "react"
import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react"
import { num } from "@/shared/lib/format"
import type { Tone } from "@/shared/ui/kit"

export type TxDirection = "in" | "out" | "pending"
interface TxLike { amount: number; direction?: TxDirection | string; type?: string }

/** جهت تراکنش: سرور direction را می‌فرستد؛ برای پاسخ‌های قدیمی از علامت مبلغ استفاده می‌شود. */
export function txDirection(t: TxLike): TxDirection {
  if (t.direction === "in" || t.direction === "out" || t.direction === "pending") return t.direction
  return t.amount >= 0 && t.type !== "purchase" ? "in" : "out"
}

/** آیکن/رنگ/متن مبلغ: واریز سبز (+)، خرج قرمز (−، حتی ۰ تومان)، در انتظار زرد. */
export function txMeta(t: TxLike): { icon: ReactNode; tone: Tone; color: string; text: string; dir: TxDirection } {
  const dir = txDirection(t)
  const mag = Math.abs(t.amount || 0)
  if (dir === "in") return { dir, icon: <ArrowDownLeft size={18} />, tone: "ok", color: "var(--ok)", text: `+${num(mag)}` }
  if (dir === "pending") return { dir, icon: <Clock size={18} />, tone: "warn", color: "var(--warn)", text: `${num(mag)}` }
  return { dir, icon: <ArrowUpRight size={18} />, tone: "bad", color: "var(--bad)", text: `−${num(mag)}` }
}

export function TxAmount({ t }: { t: TxLike }) {
  const m = txMeta(t)
  return <b className="num" dir="ltr" style={{ color: m.color }}>{m.text}</b>
}
