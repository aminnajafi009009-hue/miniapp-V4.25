import { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, useEffect, useId, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, ArrowRight, Inbox, Search, Shield, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { hapticImpact, hapticSelect } from "@/shared/haptics"

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ")
export type Tone = "ok" | "warn" | "bad" | "info" | "violet" | "pink" | "cyan" | "gold" | "blue" | "green" | "purple"

/* ---------- Card ---------- */
interface CardProps extends HTMLAttributes<HTMLDivElement> { flat?: boolean; hero?: boolean; pad0?: boolean; tap?: boolean }
export function Card({ flat, hero, pad0, tap, className, onClick, ...p }: CardProps) {
  return <div className={cx("x-card", flat && "flat", hero && "hero", pad0 && "pad0", (tap || onClick) && "tap", className)} onClick={onClick} {...p} />
}

/* ---------- Tile (icon) ---------- */
export function Tile({ icon, tone, size, solid, className }: { icon: ReactNode; tone?: Tone; size?: "sm" | "lg"; solid?: boolean; className?: string }) {
  return <span className={cx("x-tile", size, solid && "solid", tone && `t-${tone}`, className)}>{icon}</span>
}

/* ---------- Button ---------- */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "default" | "danger" | "ok" | "ghost"; size?: "sm" | "md" | "lg"; full?: boolean; loading?: boolean; icon?: ReactNode; iconOnly?: boolean
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", size = "md", full, loading, icon, iconOnly, className, children, disabled, onClick, type = "button", ...p }, ref) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading}
      className={cx("x-btn", variant !== "default" && variant, size !== "md" && size, full && "full", iconOnly && "icon", className)}
      onClick={(e) => { hapticImpact("light"); onClick?.(e) }} {...p}>
      {loading ? <span className="spin" /> : icon}
      {children}
    </button>
  )
})

/* ---------- Chip / Dot ---------- */
export function Chip({ tone, icon, on, className, children, onClick }: { tone?: "ok" | "warn" | "bad" | "info" | "acc"; icon?: ReactNode; on?: boolean; className?: string; children: ReactNode; onClick?: () => void }) {
  const Tag: any = onClick ? "button" : "span"
  return <Tag className={cx("x-chip", tone, on && "on", className)} onClick={onClick ? () => { hapticSelect(); onClick() } : undefined}>{icon}{children}</Tag>
}

/* ---------- Switch ---------- */
export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
    className={cx("x-switch", checked && "on")} onClick={() => { hapticSelect(); onChange(!checked) }} style={disabled ? { opacity: .5 } : undefined} />
}

/* ---------- Segmented / Tabs ---------- */
export function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return <div className="x-seg">{options.map((o) => <button key={String(o.value)} className={cx(o.value === value && "on")} onClick={() => { hapticSelect(); onChange(o.value) }}>{o.label}</button>)}</div>
}
export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: ReactNode; count?: number }[]; onChange: (v: T) => void }) {
  return <div className="x-tabs">{options.map((o) => <Chip key={o.value} on={o.value === value} onClick={() => onChange(o.value)}>{o.label}{o.count != null ? ` · ${o.count}` : ""}</Chip>)}</div>
}

/* ---------- Progress ---------- */
export function Bar({ value, tone }: { value: number | null | undefined; tone?: "warn" | "bad" }) {
  const v = Math.max(0, Math.min(100, value ?? 0))
  const t = tone ?? (v >= 90 ? "bad" : v >= 75 ? "warn" : undefined)
  return <div className={cx("x-bar", t)}><i style={{ width: `${v}%` }} /></div>
}

export function Ring({ value, size = 96, stroke = 9, children, tone }: { value: number | null | undefined; size?: number; stroke?: number; children?: ReactNode; tone?: "ok" | "warn" | "bad" }) {
  const id = useId().replace(/:/g, "")
  const v = Math.max(0, Math.min(100, value ?? 0))
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  const color = tone ? `var(--${tone})` : v >= 90 ? "var(--bad)" : v >= 75 ? "var(--warn)" : `url(#g${id})`
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg) scaleY(-1)" }}>
        <defs><linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent-2)" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--s3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>{children}</div>
    </div>
  )
}

/* ---------- Charts (pure SVG, no deps) ---------- */
/* data/values are chronological (oldest → newest), drawn left → right like any standard chart */
export function BarChart({ data, height = 120, format, highlightLast = true }: { data: { label: string; value: number }[]; height?: number; format?: (v: number) => string; highlightLast?: boolean }) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data])
  const W = 320, pad = 4, gap = 4, n = Math.max(1, data.length)
  const bw = Math.max(3, (W - pad * 2 - gap * (n - 1)) / n)
  const id = useId().replace(/:/g, "")
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img">
        <defs><linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent-2)" stopOpacity=".55" /></linearGradient></defs>
        {[.25, .5, .75].map((g) => <line key={g} x1="0" x2={W} y1={height * g} y2={height * g} stroke="var(--line)" strokeDasharray="3 4" />)}
        {data.map((d, i) => {
          const h = Math.max(d.value > 0 ? 3 : 1, (d.value / max) * (height - 6))
          const x = pad + i * (bw + gap)
          return <rect key={i} x={x} y={height - h} width={bw} height={h} rx={Math.min(4, bw / 2)} fill={`url(#b${id})`} opacity={highlightLast && i !== n - 1 ? .72 : 1}><title>{`${d.label}: ${format ? format(d.value) : d.value}`}</title></rect>
        })}
      </svg>
      {data.length > 0 && <div className="x-between x-muted" style={{ marginTop: 4, direction: "ltr" }}><span>{data[0].label}</span><span>{data[data.length - 1].label}</span></div>}
    </div>
  )
}

export function Sparkline({ values, height = 44, color = "var(--accent)" }: { values: number[]; height?: number; color?: string }) {
  const id = useId().replace(/:/g, "")
  const W = 200
  if (values.length < 2) return <div style={{ height }} />
  const max = Math.max(1, ...values), min = Math.min(...values)
  const span = Math.max(1, max - min)
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, height - 4 - ((v - min) / span) * (height - 8)])
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs><linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${d} L0,${height} L${W},${height} Z`} fill={`url(#s${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function Donut({ parts, size = 110, stroke = 14, center }: { parts: { value: number; color: string; label: string }[]; size?: number; stroke?: number; center?: ReactNode }) {
  const total = parts.reduce((a, b) => a + b.value, 0) || 1
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  let acc = 0
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--s2)" strokeWidth={stroke} />
        {parts.map((p, i) => { const len = (p.value / total) * c; const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={stroke} strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-acc} />; acc += len; return el })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>{center}</div>
    </div>
  )
}

/* ---------- Sheet ---------- */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])
  if (!open) return null
  // پورتال به body: داخل صفحه‌ی انیمیشنی (stacking context) رندر نشود تا زیر منوی پایین نماند
  return createPortal(
    <div className="x-overlay" onClick={onClose}>
      <div className="x-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="x-grab" />
        {title && <div className="x-h2" style={{ marginBottom: 12 }}>{title}</div>}
        <div className="x-stack" style={{ gap: 12 }}>{children}</div>
        {footer && <div className="x-stack" style={{ marginTop: 14 }}>{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ---------- Form ---------- */
interface FieldProps { label?: string; hint?: string; error?: string }
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps & { ltr?: boolean }>(function Input({ label, hint, error, ltr, className, ...p }, ref) {
  return <div className="x-field">{label && <label className="x-label">{label}</label>}<input ref={ref} className={cx("x-input", error && "err", ltr && "ltr", className)} {...p} />{error ? <span className="x-err">{error}</span> : hint ? <span className="x-muted">{hint}</span> : null}</div>
})
export function Textarea({ label, hint, error, className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  return <div className="x-field">{label && <label className="x-label">{label}</label>}<textarea className={cx("x-textarea", error && "err", className)} {...p} />{error ? <span className="x-err">{error}</span> : hint ? <span className="x-muted">{hint}</span> : null}</div>
}
export function Select({ label, hint, className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  return <div className="x-field">{label && <label className="x-label">{label}</label>}<select className={cx("x-select", className)} {...p}>{children}</select>{hint && <span className="x-muted">{hint}</span>}</div>
}
export function SearchBox({ value, onChange, placeholder = "جستجو…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <div className="x-search"><Search size={17} /><input className="x-input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>
}

/* ---------- Rows / lists ---------- */
export function Row({ icon, tone, title, sub, right, onClick, chevron = true, href }: { icon?: ReactNode; tone?: Tone; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; chevron?: boolean; href?: string }) {
  const nav = useNavigate()
  const clickable = !!(onClick || href)
  const Tag: any = clickable ? "button" : "div"
  return (
    <Tag className="x-item" onClick={clickable ? () => { hapticSelect(); onClick ? onClick() : href && (/^https?:/.test(href) ? window.open(href, "_blank") : nav(href)) } : undefined}>
      {icon && <Tile icon={icon} tone={tone} />}
      <div className="x-grow"><div className="t x-fulltext">{title}</div>{sub && <div className="s x-fulltext">{sub}</div>}</div>
      {right}
      {clickable && chevron && <ChevronLeft size={17} className="chev" />}
    </Tag>
  )
}
export const List = ({ children }: { children: ReactNode }) => <Card pad0><div className="x-list">{children}</div></Card>

export function Section({ title, action, children }: { title?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return <section className="x-stack">{title && <div className="x-sec"><span>{title}</span>{action}</div>}{children}</section>
}
export function Stat({ label, value, icon, tone, sub }: { label: string; value: ReactNode; icon?: ReactNode; tone?: Tone; sub?: ReactNode }) {
  return <div className="x-stat">{icon && <Tile icon={icon} tone={tone} size="sm" />}<div className="v num" style={{ marginTop: icon ? 6 : 0 }}>{value}</div><div className="l">{label}</div>{sub && <div className="x-muted">{sub}</div>}</div>
}
export function KV({ k, v }: { k: ReactNode; v: ReactNode }) { return <div className="x-kv"><span className="k">{k}</span><span className="v">{v}</span></div> }

export function Empty({ title = "موردی یافت نشد", sub, icon, action }: { title?: string; sub?: string; icon?: ReactNode; action?: ReactNode }) {
  return <div className="x-empty">{icon ?? <Inbox size={34} strokeWidth={1.5} />}<b>{title}</b>{sub && <span className="x-sub">{sub}</span>}{action}</div>
}
export function Alert({ tone, children }: { tone?: "warn" | "bad" | "ok"; children: ReactNode }) {
  const I = tone === "warn" ? AlertTriangle : tone === "bad" ? XCircle : tone === "ok" ? CheckCircle2 : Info
  return <div className={cx("x-alert", tone)}><I size={18} style={{ flex: "none", marginTop: 3 }} /><div>{children}</div></div>
}
export function Skeleton({ width = "100%", height = 16, radius = 10, style }: { width?: string | number; height?: string | number; radius?: string | number; style?: React.CSSProperties }) {
  return <span className="x-skel" style={{ width, height, borderRadius: radius, ...style }} />
}
export function PageSkeleton() {
  return <div className="x-stack" style={{ gap: 12 }}><Skeleton height={130} radius={26} /><Skeleton height={64} radius={18} /><Skeleton height={64} radius={18} /><Skeleton height={64} radius={18} /></div>
}

/* ---------- Brand / header ---------- */
export function Logo({ size = 34 }: { size?: number }) {
  return <span className="x-logo" style={{ width: size, height: size, borderRadius: size * .32 }}><Shield size={size * .55} strokeWidth={2.4} /></span>
}
function tgPhoto(): string | null {
  try { return (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || null } catch { return null }
}
export function Avatar({ name, src, size = 44, me }: { name?: string; src?: string | null; size?: number; me?: boolean }) {
  const [bad, setBad] = useState(false)
  const url = src || (me ? tgPhoto() : null)
  return <span className="x-avatar" style={{ width: size, height: size, fontSize: size * .4 }}>{url && !bad ? <img src={url} alt="" onError={() => setBad(true)} /> : (name || "?").trim().slice(0, 1).toUpperCase()}</span>
}
export function PageTop({ title, sub, back, right }: { title: ReactNode; sub?: ReactNode; back?: boolean | string; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="x-top">
      {back && <button className="x-back" aria-label="بازگشت" onClick={() => (typeof back === "string" ? nav(back) : nav(-1))}><ArrowRight size={19} /></button>}
      <div className="x-grow"><div className="x-h1 x-ellipsis">{title}</div>{sub && <div className="x-sub x-ellipsis">{sub}</div>}</div>
      {right}
    </div>
  )
}
export { ChevronLeft, ChevronRight }
