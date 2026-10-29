import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { resellerGet, resellerPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { getServices, revokeServiceLink, toggleServiceLink } from "@/shared/api/services"
import type { VipService } from "@/shared/api/types"
import { ask } from "@/shared/lib/confirm"
import { Alert, Button, Chip, Empty, Input, PageSkeleton, PageTop, SearchBox, Segmented, Sheet } from "@/shared/ui/kit"
import { ServiceCard } from "@/pages/Services/ServicesPage"
import { serviceTitle, toman } from "@/shared/lib/format"

type Mode = "add" | "reduce"

export default function ResellerServices() {
  const [list, setList] = useState<VipService[] | null>(null)
  const [err, setErr] = useState(false)
  const [q, setQ] = useState("")
  const [sel, setSel] = useState<VipService | null>(null)
  const [options, setOptions] = useState<any[]>([])
  const [mode, setMode] = useState<Mode>("add")
  const [gb, setGb] = useState("")
  const [days, setDays] = useState("")
  const [opt, setOpt] = useState<number | null>(null)
  const [quote, setQuote] = useState<{ price: number; mode: string; wallet: number } | null>(null)
  const [title, setTitle] = useState("")
  const [busy, setBusy] = useState(false)

  const load = () => { setErr(false); setList(null); getServices().then((r) => setList(r.vip || [])).catch(() => setErr(true)) }
  useEffect(load, [])
  useEffect(() => { resellerGet("/services/options").then((r) => { setOptions(r.options || []); if (r.options?.length) setOpt(r.options[0].num) }).catch(() => {}) }, [])

  const open = (s: VipService) => { setSel(s); setTitle(s.title && s.title !== s.package_name ? serviceTitle(s) : ""); setGb(""); setDays(""); setQuote(null); setMode("add") }
  const delta = () => {
    const g = Math.max(0, parseInt(gb || "0", 10) || 0), d = Math.max(0, parseInt(days || "0", 10) || 0)
    const sign = mode === "add" ? 1 : -1
    return { gb: g * sign, days: d * sign, empty: g === 0 && d === 0 }
  }
  useEffect(() => {
    setQuote(null)
    const dl = delta()
    if (!sel || dl.empty) return
    const t = setTimeout(() => { resellerPost(`/services/${sel.id}/quote`, { gb: dl.gb, days: dl.days, option_num: opt }).then(setQuote).catch(() => setQuote(null)) }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gb, days, mode, opt, sel])

  const run = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true)
    try { await fn(); toast.success(ok); load(); return true } catch (e) { toast.error(friendlyErrorMessage(e, "ناموفق بود")); return false } finally { setBusy(false) }
  }
  const apply = async () => {
    const dl = delta()
    if (!sel || dl.empty) return
    const msg = mode === "add" ? `${toman(quote?.price || 0)} از کیف پول شما کسر شود؟` : `${toman(quote?.price || 0)} به کیف پول شما برگردانده شود؟`
    if (!(await ask(msg))) return
    if (await run(() => resellerPost(`/services/${sel.id}/adjust`, { gb: dl.gb, days: dl.days, option_num: opt }), mode === "add" ? "افزایش انجام شد" : "کاهش انجام شد")) setSel(null)
  }

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (list || []).filter((s) => !t || serviceTitle(s).toLowerCase().includes(t))
  }, [list, q])

  return (
    <div className="x-stack">
      <PageTop title="مدیریت سرویس‌ها" sub={list ? `${list.length} سرویس` : undefined} />
      <SearchBox value={q} onChange={setQ} placeholder="جستجوی سرویس…" />
      {err ? <Alert tone="bad">دریافت ناموفق بود</Alert> : !list ? <PageSkeleton /> : shown.length === 0 ? <Empty title="سرویسی پیدا نشد" /> :
        shown.map((s) => <ServiceCard key={s.id} s={s} onClick={() => open(s)} />)}

      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? serviceTitle(sel) : ""}>
        {sel && <>
          <div className="x-row-flex">{sel.link_disabled ? <Chip tone="bad">لینک غیرفعال</Chip> : <Chip tone="ok">لینک فعال</Chip>}</div>
          <Input label="نام نمایشی سرویس" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button full loading={busy} onClick={() => run(() => resellerPost(`/services/${sel.id}/rename`, { title }), "نام ذخیره شد")}>ذخیره نام</Button>

          <Segmented<Mode> value={mode} options={[{ value: "add", label: "افزایش (شارژ)" }, { value: "reduce", label: "کاهش (بازگشت وجه)" }]} onChange={setMode} />
          {options.length > 1 && <Segmented<string> value={String(opt ?? "")} options={options.map((o) => ({ value: String(o.num), label: o.name }))} onChange={(v) => setOpt(Number(v))} />}
          <Input label="حجم (گیگ)" type="number" value={gb} onChange={(e) => setGb(e.target.value)} />
          <Input label="زمان (روز)" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
          {quote && <Alert tone={mode === "add" ? "warn" : "ok"}>{mode === "add" ? `مبلغ کسر از کیف پول: ${toman(quote.price)}` : `مبلغ بازگشتی به کیف پول: ${toman(quote.price)}`}</Alert>}
          <Button variant="primary" full loading={busy} disabled={delta().empty} onClick={apply}>{mode === "add" ? "افزایش حجم/زمان" : "کاهش حجم/زمان"}</Button>

          <Button full loading={busy} onClick={() => run(() => toggleServiceLink(sel.id, !!sel.link_disabled), sel.link_disabled ? "لینک فعال شد" : "لینک غیرفعال شد").then((ok) => ok && setSel(null))}>{sel.link_disabled ? "فعال‌سازی لینک" : "غیرفعال‌سازی لینک"}</Button>
          <Button variant="danger" full loading={busy} onClick={async () => { if (await ask("لینک ساب جدید ساخته شود؟ لینک قبلی از کار می‌افتد.")) run(() => revokeServiceLink(sel.id), "لینک جدید ساخته شد").then((ok) => ok && setSel(null)) }}>ساخت لینک ساب جدید</Button>
        </>}
      </Sheet>
    </div>
  )
}
