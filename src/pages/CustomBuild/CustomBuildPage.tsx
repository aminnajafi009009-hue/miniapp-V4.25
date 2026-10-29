import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"
import { Clock, Database, Globe2, Layers, RefreshCw, Type, Wallet as WalletIcon, CreditCard, Wrench } from "lucide-react"
import { getCustomBuildLimits, getHome, getOnlinePaymentStatus } from "@/shared/api/services"
import { cbCardInfo, cbCardReceipt, cbOnlineCreate, cbQuote, cbWallet, fetchCustomBuildOptions, type RenewMode } from "@/shared/api/purchase"
import type { CustomBuildLimits, CustomBuildOrderType, MapOption } from "@/shared/api/types"
import { ApiError, apiGet, friendlyErrorMessage } from "@/shared/api/client"
import { Alert, Button, Card, Input, KV, PageSkeleton, PageTop, Section, Tile } from "@/shared/ui/kit"
import { CardInfoCard, ChoiceCard, DoneScreen, OnlineGatewayCard, ReceiptPicker, StickyBar, openPaymentLink, type GatewayExtra } from "@/shared/ui/purchase"
import { ExpiryCountdown } from "@/shared/ui/ExpiryCountdown"
import type { OnlineGateway } from "@/shared/api/types"
import { faDigits, toman } from "@/shared/lib/format"

type Step = "options" | "form" | "checkout" | "card-pay" | "online-pay" | "done"
const LATIN = /^[A-Za-z0-9]+$/
interface NavState { orderType?: CustomBuildOrderType; targetConfigId?: number; planLabel?: string }

export default function CustomBuildPage() {
  const st = ((useLocation().state as NavState) || {})
  const orderType: CustomBuildOrderType = st.orderType === "renew" ? "renew" : "new"
  const [disabled, setDisabled] = useState(false)
  const [baseLimits, setLimits] = useState<CustomBuildLimits | null>(null)
  const [options, setOptions] = useState<MapOption[]>([])
  const [option, setOption] = useState<MapOption | null>(null)
  const [step, setStep] = useState<Step>("form")
  const [volume, setVolume] = useState(0)
  const [days, setDays] = useState(0)
  const [name, setName] = useState("")
  const [nameErr, setNameErr] = useState("")
  const [mode, setMode] = useState<RenewMode>("both")
  const [price, setPrice] = useState<number | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [card, setCard] = useState<{ card_number: string; card_holder: string; price: number; invoice_id?: number; expires_at?: string } | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [failed, setFailed] = useState(false)
  const [onlineCfg, setOnlineCfg] = useState<{ enabled: boolean; gateways: OnlineGateway[] }>({ enabled: false, gateways: [] })
  const [online, setOnline] = useState<{ paymentId: number; link: string; price: number; expiresAt?: string; extra?: GatewayExtra } | null>(null)
  // تنظیمات تمدیدِ ثبت‌شده‌ی ادمین برای پلن/پوشه‌ی همین سرویس (نوع، حداقل/حداکثر، قیمت، گزینه‌های سریع)
  interface RenewSettings { mode: RenewMode; min_day: number; max_day: number; min_gb: number; max_gb: number; price_day: number; price_gb: number; day_options: number[]; gb_options: number[] }
  const [rs, setRs] = useState<RenewSettings | null>(null)

  useEffect(() => {
    (async () => {
      try {
        if (orderType === "new") {
          const h = await getHome().catch(() => null)
          if (h && h.custom_build_enabled === false) { setDisabled(true); return }
        }
        const l = await getCustomBuildLimits()
        setLimits(l); setVolume(l.min_gb); setDays(l.min_days)
        const lx = l as unknown as { online_payment_enabled?: boolean; online_gateways?: OnlineGateway[] }
        setOnlineCfg({ enabled: !!lx.online_payment_enabled, gateways: lx.online_gateways || [] })
        if (orderType === "new") {
          const opts = await fetchCustomBuildOptions()
          setOptions(opts)
          if (opts.length === 1) setOption(opts[0])
          else if (opts.length > 1) setStep("options")
        }
      } catch { setFailed(true) }
    })()
  }, [orderType])

  useEffect(() => {
    if (orderType !== "renew" || !st.targetConfigId) return
    apiGet(`/api/services/${st.targetConfigId}/renew-settings`).then((r) => {
      const s = r as RenewSettings | null
      if (!s || !s.mode) return
      setRs(s); setMode(s.mode)
      setVolume(s.mode === "time" ? 0 : s.min_gb || 1)
      setDays(s.mode === "volume" ? 0 : s.min_day || 1)
    }).catch(() => {})
  }, [orderType, st.targetConfigId])

  // هر گزینه (پلن نگاشت‌شده) قیمت و محدوده‌ی خودش را دارد؛ مقادیر خالی از تنظیم عمومی می‌آید
  const limits = useMemo<CustomBuildLimits | null>(() => {
    if (!baseLimits) return null
    if (rs) return { ...baseLimits, min_gb: rs.min_gb || 1, max_gb: rs.max_gb || baseLimits.max_gb, min_days: rs.min_day || 1, max_days: rs.max_day || baseLimits.max_days, price_per_gb: rs.price_gb, price_per_30_days: Math.round(rs.price_day * 30) }
    if (!option) return baseLimits
    const pick = <K extends keyof CustomBuildLimits>(k: K): number => (option[k] as number | undefined) ?? baseLimits[k]
    return { min_gb: pick("min_gb"), max_gb: pick("max_gb"), min_days: pick("min_days"), max_days: pick("max_days"), price_per_gb: pick("price_per_gb"), price_per_30_days: pick("price_per_30_days") }
  }, [baseLimits, option, rs])
  useEffect(() => { if (limits && orderType === "new") { setVolume(limits.min_gb); setDays(limits.min_days) } }, [option]) // eslint-disable-line react-hooks/exhaustive-deps

  const needVol = !(orderType === "renew" && mode === "time")
  const needDays = !(orderType === "renew" && mode === "volume")
  const ready = (!needVol || !!volume) && (!needDays || !!days)

  useEffect(() => {
    if (!limits || !ready) return
    setQuoting(true)
    const t = setTimeout(() => {
      cbQuote(volume, days, orderType, orderType === "renew" ? mode : undefined, option?.num, st.targetConfigId)
        .then((r) => setPrice(r.price)).catch(() => setPrice(null)).finally(() => setQuoting(false))
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, days, limits, mode, orderType, option])

  const canGo = useMemo(() => ready && (orderType !== "new" || (!!name.trim() && LATIN.test(name.trim()))), [ready, orderType, name])
  const base = () => ({ volumeGb: volume, days, name: orderType === "new" ? name.trim() : undefined, orderType, renewMode: orderType === "renew" ? mode : undefined, targetConfigId: st.targetConfigId, optionNum: option?.num })

  if (disabled) return <div className="x-page"><PageTop title="سرویس سفارشی" back="/" /><Alert tone="bad">ساخت سرویس سفارشی فعلاً غیرفعال است.</Alert></div>

  if (failed) return <div className="x-page"><PageTop title="سرویس سفارشی" back="/" /><Alert tone="bad">دریافت تنظیمات ساخت سرویس ناموفق بود.</Alert></div>
  if (!limits) return <div className="x-page"><PageTop title="سرویس سفارشی" back="/" /><PageSkeleton /></div>

  const title = orderType === "renew" ? "تمدید سرویس" : "سرویس سفارشی"
  const priceText = quoting ? "…" : price != null ? toman(price) : "—"

  async function wallet() {
    setBusy(true)
    try { await cbWallet(base()); toast.success("پرداخت موفق! سرویس شما به‌زودی ساخته می‌شود."); setStep("done") }
    catch (e) {
      const c = (e as ApiError).code
      toast.error(c === "insufficient_balance" ? "موجودی کیف پول کافی نیست" : c === "orders_closed" ? "بخش سفارشات موقتاً بسته است" : friendlyErrorMessage(e, "خطا در ثبت سفارش"))
    } finally { setBusy(false) }
  }
  async function startCard() {
    setBusy(true)
    try { setCard(await cbCardInfo(base())); setFile(null); setStep("card-pay") }
    catch (e) { toast.error(friendlyErrorMessage(e, "خطا در دریافت اطلاعات پرداخت")) } finally { setBusy(false) }
  }
  async function startOnline(gw?: OnlineGateway) {
    setBusy(true)
    try {
      const res = await cbOnlineCreate({ ...base(), gateway: gw?.key })
      setOnline({ paymentId: res.payment_id, link: res.payment_link, price: res.price, expiresAt: res.expires_at,
        extra: gw ? { title: gw.title, link2: res.payment_link2, infoLines: res.info_lines, tronAmount: res.tron_amount, gateway: res.gateway, paymentId: res.payment_id } : undefined })
      setStep("online-pay")
      openPaymentLink(res.payment_link)
    } catch (e) {
      const c = (e as ApiError).code
      toast.error(c === "amount_too_low" ? "برای این مبلغ درگاه آنلاین قابل استفاده نیست. از کارت‌به‌کارت یا کیف پول استفاده کنید." : friendlyErrorMessage(e, "خطا در اتصال به درگاه پرداخت"))
    } finally { setBusy(false) }
  }
  async function checkOnline() {
    if (!online) return
    setBusy(true)
    try {
      const r = await getOnlinePaymentStatus(online.paymentId)
      if (r.status === "paid") { toast.success("پرداخت تأیید شد؛ سرویس شما به‌زودی ساخته می‌شود"); setStep("done") }
      else toast.error("هنوز پرداختی برای این تراکنش ثبت نشده؛ چند لحظه بعد دوباره امتحان کنید")
    } catch { toast.error("خطا در بررسی وضعیت پرداخت") } finally { setBusy(false) }
  }
  async function receipt() {
    if (!file) return
    setBusy(true)
    try { await cbCardReceipt({ ...base(), file, invoiceId: card?.invoice_id }); toast.success("رسید ارسال شد؛ پس از تأیید ادمین سرویس ساخته می‌شود"); setStep("done") }
    catch (e) { toast.error(friendlyErrorMessage(e, "خطا در ارسال رسید")) } finally { setBusy(false) }
  }
  function goCheckout() {
    if (orderType === "new" && !LATIN.test(name.trim())) { setNameErr("فقط حروف انگلیسی و عدد، بدون فاصله (مثال: aminvpn1)"); return }
    setNameErr(""); setStep("checkout")
  }

  if (step === "done") return <div className="x-page"><DoneScreen text="سرویس شما پس از بررسی ساخته و ارسال می‌شود." /></div>

  if (step === "options") return (
    <div className="x-page">
      <PageTop title={title} sub="یکی از گزینه‌ها را انتخاب کنید" back="/" />
      <div className="x-stack">
        {options.map((o) => <ChoiceCard key={o.num} icon={<Layers size={19} />} title={o.name} sub={o.price_per_gb != null ? `هر گیگ ${toman(o.price_per_gb)} · ${faDigits(o.min_gb ?? 0)}–${faDigits(o.max_gb ?? 0)} گیگ · ${faDigits(o.min_days ?? 0)}–${faDigits(o.max_days ?? 0)} روز` : undefined} on={option?.num === o.num} onClick={() => { setOption(o); setStep("form") }} />)}
      </div>
    </div>
  )

  if (step === "card-pay" && card) return (
    <div className="x-page">
      <PageTop title="پرداخت کارت‌به‌کارت" back={false} />
      <CardInfoCard cardNumber={card.card_number} holder={card.card_holder} price={card.price} expiresAt={card.expires_at}
        onExpire={() => { toast.error("مهلت پرداخت این فاکتور به پایان رسید. دوباره سفارش دهید."); setCard(null); setStep("checkout") }} />
      <ReceiptPicker file={file} onChange={setFile} />
      <StickyBar>
        <Button variant="primary" size="lg" full disabled={!file} loading={busy} onClick={receipt}>ارسال رسید برای تأیید</Button>
        <Button variant="ghost" full onClick={() => setStep("checkout")}>بازگشت</Button>
      </StickyBar>
    </div>
  )

  if (step === "online-pay" && online) return (
    <div className="x-page">
      <PageTop title="پرداخت آنلاین" back={false} />
      {online.expiresAt && <ExpiryCountdown expiresAt={online.expiresAt} onExpire={() => { toast.error("مهلت پرداخت این فاکتور به پایان رسید. دوباره سفارش دهید."); setOnline(null); setStep("checkout") }} />}
      <OnlineGatewayCard price={online.price} link={online.link} planName={title} extra={online.extra}
        text="روی دکمه‌ی «رفتن به درگاه پرداخت» بزنید و مبلغ را واریز کنید. به‌محض تأیید، سفارش شما خودکار ثبت می‌شود؛ در صورت نیاز وضعیت را دستی هم بررسی کنید." />
      <StickyBar>
        <Button variant="ok" size="lg" full loading={busy} icon={<RefreshCw size={17} />} onClick={checkOnline}>پرداخت را انجام دادم / بررسی کن</Button>
        <Button variant="ghost" full onClick={() => setStep("checkout")}>بازگشت</Button>
      </StickyBar>
    </div>
  )

  if (step === "checkout") return (
    <div className="x-page">
      <PageTop title="تأیید سفارش" back={false} />
      <Card hero>
        {option && <KV k="گزینه" v={option.name} />}
        {st.planLabel && <KV k="سرویس" v={st.planLabel} />}
        {needVol && <KV k="حجم" v={`${faDigits(volume)} گیگابایت`} />}
        {needDays && <KV k="مدت" v={`${faDigits(days)} روز`} />}
        {orderType === "new" && <KV k="نام سرویس" v={<span dir="ltr">{name.trim()}</span>} />}
        <div className="x-divider" />
        <KV k="قیمت نهایی" v={<b>{priceText}</b>} />
      </Card>
      <StickyBar>
        <Button variant="primary" size="lg" full icon={<WalletIcon size={17} />} loading={busy} onClick={wallet}>پرداخت از کیف پول</Button>
        {onlineCfg.enabled && <Button full icon={<Globe2 size={17} />} loading={busy} onClick={() => startOnline()}>پرداخت آنلاین</Button>}
        {onlineCfg.gateways.map((gw) => <Button key={gw.key} full icon={<Globe2 size={17} />} loading={busy} onClick={() => startOnline(gw)}>{gw.title}</Button>)}
        <Button full icon={<CreditCard size={17} />} loading={busy} onClick={startCard}>کارت‌به‌کارت</Button>
        <Button variant="ghost" full onClick={() => setStep("form")}>بازگشت</Button>
      </StickyBar>
    </div>
  )

  const modes: { v: RenewMode; l: string; icon: ReactNode; set: () => void }[] = [
    { v: "time", l: "تمدید زمان — حداقل ۳۰ روز", icon: <Clock size={19} />, set: () => { setMode("time"); setVolume(0); setDays(Math.max(30, limits.min_days)) } },
    { v: "volume", l: "تمدید حجم — حداقل ۵ گیگ", icon: <Database size={19} />, set: () => { setMode("volume"); setVolume(5); setDays(0) } },
    { v: "both", l: "تمدید حجم و زمان", icon: <RefreshCw size={19} />, set: () => { setMode("both"); setVolume(limits.min_gb); setDays(limits.min_days) } },
  ]

  return (
    <div className="x-page">
      <PageTop title={title} sub={st.planLabel} back={true} />
      <Card hero>
        <div className="x-row-flex"><Tile tone="info" icon={<Wrench size={20} />} />
          <div className="x-grow"><div className="x-h3">{option?.name || "ساخت دلخواه"}</div>
            <div className="x-muted">هر گیگ {toman(limits.price_per_gb)} + هر ۳۰ روز {toman(limits.price_per_30_days)}</div></div></div>
      </Card>
      {orderType === "renew" && !rs && <Section title="نوع تمدید"><div className="x-stack">{modes.map((m) => <ChoiceCard key={m.v} icon={m.icon} title={m.l} on={mode === m.v} onClick={m.set} />)}</div></Section>}
      {needVol && <Card><div className="x-stack" style={{ gap: 6 }}>
        <div className="x-row-flex"><Database size={16} /><span className="x-grow x-h3">حجم</span><b className="num">{faDigits(volume)} گیگ</b></div>
        <input className="x-range" type="range" min={orderType === "renew" && mode === "volume" && !rs ? 5 : limits.min_gb} max={limits.max_gb} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        <div className="x-muted">بین {faDigits(limits.min_gb)} تا {faDigits(limits.max_gb)} گیگابایت</div>
        {rs && rs.gb_options.length > 0 && <div className="x-row-flex" style={{ flexWrap: "wrap", gap: 6 }}>{rs.gb_options.map((v) => <button key={v} type="button" className="x-chip" onClick={() => setVolume(v)}>{faDigits(v)} گیگ</button>)}</div>}</div></Card>}
      {needDays && <Card><div className="x-stack" style={{ gap: 6 }}>
        <div className="x-row-flex"><Clock size={16} /><span className="x-grow x-h3">مدت</span><b className="num">{faDigits(days)} روز</b></div>
        <input className="x-range" type="range" min={orderType === "renew" && mode === "time" && !rs ? 30 : limits.min_days} max={limits.max_days} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        <div className="x-muted">بین {faDigits(limits.min_days)} تا {faDigits(limits.max_days)} روز</div>
        {rs && rs.day_options.length > 0 && <div className="x-row-flex" style={{ flexWrap: "wrap", gap: 6 }}>{rs.day_options.map((v) => <button key={v} type="button" className="x-chip" onClick={() => setDays(v)}>{faDigits(v)} روز</button>)}</div>}</div></Card>}
      {orderType === "new" && <Input label="نام سرویس (فقط لاتین، بدون فاصله)" ltr placeholder="aminvpn1" icon={<Type size={16} />} value={name} error={nameErr}
        onChange={(e) => { setName(e.target.value); setNameErr("") }} />}
      <StickyBar>
        <div className="x-row-flex"><span className="x-grow x-sub">قیمت تخمینی</span><b className="num">{priceText}</b></div>
        <Button variant="primary" size="lg" full disabled={!canGo} onClick={goCheckout}>ادامه</Button>
        {options.length > 1 && orderType === "new" && <Button variant="ghost" full onClick={() => setStep("options")}>تغییر گزینه</Button>}
      </StickyBar>
    </div>
  )
}
