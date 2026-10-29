import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import WebApp from "@twa-dev/sdk"
import { Gift, Wallet as WalletIcon, CreditCard, FlaskConical } from "lucide-react"
import { buyPlanWithWallet, getCardInfo, uploadPlanReceipt, validateDiscount } from "@/shared/api/services"
import { getFreeTrialData, type FreeTrialData } from "@/shared/api/purchase"
import type { FreeTrialPlan } from "@/shared/api/types"
import { ApiError, friendlyErrorMessage } from "@/shared/api/client"
import { Alert, Button, Card, Chip, KV, PageSkeleton, PageTop, Section, Tile } from "@/shared/ui/kit"
import { StepIndicator } from "@/shared/ui/StepIndicator"
import { CardInfoCard, ChoiceCard, DiscountField, DoneScreen, ReceiptPicker, StickyBar } from "@/shared/ui/purchase"
import { faDigits, toman } from "@/shared/lib/format"

type Step = "pick" | "info" | "card-pay" | "done"

export default function FreeTrialPage() {
  const nav = useNavigate()
  const [data, setData] = useState<FreeTrialData | null>(null)
  const [failed, setFailed] = useState(false)
  const [step, setStep] = useState<Step>("info")
  const [chosen, setChosen] = useState<FreeTrialPlan | null>(null)
  const [code, setCode] = useState("")
  const [pct, setPct] = useState<number | null>(null)
  const [meta, setMeta] = useState<{ type: "percent" | "amount"; amount: number } | null>(null)
  const [checking, setChecking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [card, setCard] = useState<{ card_number: string; card_holder: string; price: number; invoice_id?: number; expires_at?: string } | null>(null)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    getFreeTrialData().then((r) => {
      setData(r)
      const list = r.plans || []
      if (list.length > 1) setStep("pick")
      else setChosen(list[0] || null)
    }).catch(() => setFailed(true))
  }, [])

  if (failed) return <div className="x-page"><PageTop title="تست رایگان" back="/" /><Alert tone="bad">دریافت اطلاعات تست رایگان ناموفق بود.</Alert></div>
  if (!data) return <div className="x-page"><PageTop title="تست رایگان" back="/" /><PageSkeleton /></div>

  const plans = data.plans && data.plans.length ? data.plans : []
  // the plan the backend will price: the chosen entry, else the default plan
  const planKey = chosen?.plan_key || data.plan.key
  const planName = chosen?.name || data.plan.name
  const days = chosen?.days ?? data.plan.days
  const dur = (x: any) => (x?.duration_unit === "hours" ? `${faDigits(x.duration_value)} ساعت` : x?.days ? `${faDigits(x.days)} روز` : "زمان نامحدود")
  const durNow = chosen ? dur(chosen) : dur(data.plan)
  const vol = chosen?.volume_gb ?? data.plan.volume_gb
  const price = chosen?.price ?? data.plan.price
  const final = meta?.type === "amount" ? Math.max(0, price - meta.amount) : Math.round(price * (1 - (pct || 0) / 100))

  const used = () => WebApp.showAlert("شما قبلاً از «تست رایگان» استفاده کرده‌اید. هر کاربر فقط یک‌بار می‌تواند آن را دریافت کند.")
  const fail = (e: unknown, fb: string) => {
    const err = e as ApiError
    if (err.code === "free_test_already_used") used()
    else toast.error(friendlyErrorMessage(e, fb))
  }

  async function checkDiscount() {
    if (!code.trim()) { setPct(null); setMeta(null); return }
    setChecking(true)
    try {
      const r = await validateDiscount(code.trim(), planKey)
      if (r.valid) {
        if (r.discount_type === "amount") { setMeta({ type: "amount", amount: r.amount || 0 }); setPct(null); toast.success(`کد تخفیف ${toman(r.amount || 0)}ی اعمال شد`) }
        else { setMeta({ type: "percent", amount: 0 }); setPct(r.percent || 0); toast.success(`کد تخفیف ${faDigits(r.percent || 0)}٪ اعمال شد`) }
      } else {
        setPct(null); setMeta(null)
        toast.error(r.reason === "wrong_plan" ? "این کد روی این پلن قابل استفاده نیست" : r.reason === "user_limit_reached" ? "سهمیه‌ی شما از این کد تمام شده" : r.reason === "not_allowed" ? "شما مجاز به استفاده از این کد نیستید" : "کد تخفیف نامعتبر است")
      }
    } catch { toast.error("بررسی کد تخفیف ناموفق بود") } finally { setChecking(false) }
  }
  async function payWallet() {
    setBusy(true)
    try { await buyPlanWithWallet(planKey, code.trim()); toast.success("خرید با موفقیت انجام شد"); setStep("done") }
    catch (e) { fail(e, "ثبت خرید ناموفق بود") } finally { setBusy(false) }
  }
  async function startCard() {
    setBusy(true)
    try { setCard(await getCardInfo(planKey, code.trim())); setFile(null); setStep("card-pay") }
    catch (e) { fail(e, "دریافت اطلاعات پرداخت ناموفق بود") } finally { setBusy(false) }
  }
  async function sendReceipt() {
    if (!file) return
    setBusy(true)
    try { await uploadPlanReceipt(planKey, code.trim(), file, card?.invoice_id); toast.success("رسید ارسال شد؛ پس از تأیید ادمین سرویس ارسال می‌شود"); setStep("done") }
    catch (e) { fail(e, "ارسال رسید ناموفق بود") } finally { setBusy(false) }
  }

  if (step === "done") return <div className="x-page"><StepIndicator step={3} total={3} label="تکمیل" /><DoneScreen text="نتیجه به‌زودی برایتان اطلاع‌رسانی می‌شود." /></div>

  if (step === "pick") return (
    <div className="x-page">
      <PageTop title="تست رایگان" sub="یکی از نمونه‌ها را انتخاب کنید" back="/" />
      <Section>
        {plans.map((p) => (
          <ChoiceCard key={p.num} icon={<FlaskConical size={19} />} tone="cyan" title={p.name}
            sub={`${dur(p)}${p.volume_gb ? ` · ${faDigits(p.volume_gb)} گیگابایت` : ""}`}
            right={p.used ? <Chip tone="warn">دریافت‌شده</Chip> : undefined}
            onClick={() => { if (p.used) used(); else { setChosen(p); setStep("info") } }} />
        ))}
      </Section>
    </div>
  )

  if (step === "card-pay" && card) return (
    <div className="x-page">
      <PageTop title="کارت‌به‌کارت" back={false} />
      <StepIndicator step={2} total={3} label="پرداخت" />
      <CardInfoCard cardNumber={card.card_number} holder={card.card_holder} price={card.price} expiresAt={card.expires_at}
        onExpire={() => { toast.error("مهلت پرداخت به پایان رسید؛ دوباره تلاش کنید."); setCard(null); setStep("info") }} />
      <Section title="رسید پرداخت"><ReceiptPicker file={file} onChange={setFile} /></Section>
      <StickyBar>
        <Button variant="primary" size="lg" full disabled={!file} loading={busy} onClick={sendReceipt}>ارسال رسید برای تأیید</Button>
        <Button variant="ghost" full onClick={() => setStep("info")}>بازگشت</Button>
      </StickyBar>
    </div>
  )

  const summary = meta?.type === "amount" ? `${toman(meta.amount)} تخفیف` : pct ? `${faDigits(pct)}٪ تخفیف` : null
  return (
    <div className="x-page">
      <PageTop title="تست رایگان" sub="نمونه‌ای برای امتحان کیفیت سرویس" back={plans.length > 1 ? false : "/"}
        right={plans.length > 1 ? <Button size="sm" onClick={() => setStep("pick")}>تغییر</Button> : undefined} />
      {!data.orders_enabled && <Alert tone="bad">ربات به دلیل حجم سفارشات بالا موقتاً بسته است. روشن شدن دوباره اطلاع‌رسانی می‌شود.</Alert>}
      <Card hero>
        <div className="x-row-flex">
          <Tile size="lg" solid icon={<Gift size={24} />} />
          <div className="x-grow">
            <div className="x-h2 x-ellipsis">{planName}</div>
            <div className="x-sub">{days > 0 ? durNow : "زمان نامحدود"}{vol ? ` · ${faDigits(vol)} گیگابایت` : ""}</div>
          </div>
        </div>
      </Card>
      {price > 0 && <DiscountField value={code} onChange={setCode} onApply={checkDiscount} loading={checking} summary={summary} />}
      <Card>
        <KV k="قیمت" v={toman(price)} />
        {(pct || meta) && <KV k="تخفیف" v={<span style={{ color: "var(--ok)" }}>{meta?.type === "amount" ? `${toman(meta.amount)} −` : `${faDigits(pct || 0)}٪ −`}</span>} />}
        <div className="x-divider" />
        <div className="x-between" style={{ paddingTop: 6 }}><span className="x-h3">مبلغ نهایی</span><span className="x-h2 x-grad-text num">{toman(final)}</span></div>
        <div className="x-muted" style={{ marginTop: 6 }}>موجودی کیف پول شما: {toman(data.wallet)}</div>
      </Card>
      <StickyBar>
        {final <= 0 ? (
          <Button variant="primary" size="lg" full icon={<Gift size={18} />} loading={busy} disabled={!data.orders_enabled} onClick={payWallet}>🎁 دریافت رایگان</Button>
        ) : (<>
          <Button variant="primary" size="lg" full icon={<WalletIcon size={18} />} loading={busy} disabled={!data.orders_enabled} onClick={payWallet}>پرداخت از کیف پول</Button>
          <Button full icon={<CreditCard size={16} />} disabled={!data.orders_enabled || busy} onClick={startCard}>کارت‌به‌کارت</Button>
        </>)}
        <Button variant="ghost" size="sm" full onClick={() => nav(-1)}>بازگشت</Button>
      </StickyBar>
    </div>
  )
}
