import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { CreditCard, Crown, Globe2, Layers, Package, RefreshCw, Sparkles, Wallet as WalletIcon, Wrench } from "lucide-react"

import { getHome, buyPlanWithWallet, createOnlinePayment, getCardInfo, getOnlinePaymentStatus, getPlans, resolveServiceName, uploadPlanReceipt, validateDiscount } from "@/shared/api/services"
import type { OnlineGateway, Plan, VipCategory } from "@/shared/api/types"
import { ApiError, friendlyErrorMessage } from "@/shared/api/client"
import { Alert, Button, Card, Chip, Empty, Input, KV, PageTop, Section, Skeleton, Tile } from "@/shared/ui/kit"
import { StepIndicator } from "@/shared/ui/StepIndicator"
import { CardInfoCard, ChoiceCard, DiscountField, DoneScreen, OnlineGatewayCard, ReceiptPicker, StickyBar, openPaymentLink, type GatewayExtra } from "@/shared/ui/purchase"
import { faDigits, num, toman } from "@/shared/lib/format"
import { ExpiryCountdown as ExpiryCountdownLazy } from "@/shared/ui/ExpiryCountdown"

type Step = "list" | "checkout" | "card-pay" | "online-pay" | "done"

const formatDays = (days: number) => (days > 0 ? `${faDigits(days)} روز` : "زمان نامحدود")

export default function SubscriptionPage() {
  const navigate = useNavigate()

  const [vipCategories, setVipCategories] = useState<VipCategory[]>([])
  const [activeCategory, setActiveCategory] = useState<VipCategory | null>(null)
  const [agentPercent, setAgentPercent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [ordersEnabled, setOrdersEnabled] = useState(true)
  const [customBuildOn, setCustomBuildOn] = useState(true)
  useEffect(() => { getHome().then((h) => setCustomBuildOn(h.custom_build_enabled !== false)).catch(() => {}) }, [])
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(false)
  const [gateways, setGateways] = useState<OnlineGateway[]>([])
  const [nameMode, setNameMode] = useState<"default" | "user">("default")
  const [isAgent, setIsAgent] = useState(false)
  const [svcName, setSvcName] = useState("")
  const [finalName, setFinalName] = useState<string | null>(null)

  const [step, setStep] = useState<Step>("list")
  const [selected, setSelected] = useState<Plan | null>(null)
  const [discountCode, setDiscountCode] = useState("")
  const [discountPercent, setDiscountPercent] = useState<number | null>(null)
  const [checkingDiscount, setCheckingDiscount] = useState(false)
  const [busy, setBusy] = useState(false)
  const [busyKind, setBusyKind] = useState<"wallet" | "online" | "card" | null>(null)

  const [cardInfo, setCardInfo] = useState<{ card_number: string; card_holder: string; price: number; invoice_id?: number; expires_at?: string } | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [onlinePayment, setOnlinePayment] = useState<{ paymentId: number; paymentLink: string; price: number; expiresAt?: string; extra?: GatewayExtra } | null>(null)
  const [discountMeta, setDiscountMeta] = useState<{ type: "percent" | "amount"; amount: number } | null>(null)

  function loadPlans() {
    setLoading(true)
    setLoadError(false)
    getPlans()
      .then((res) => {
        setVipCategories(res.vip_categories || [])
        setOrdersEnabled(res.orders_enabled)
        setAgentPercent(res.agent_discount_percent || 0)
        setOnlinePaymentEnabled(!!res.online_payment_enabled)
        setGateways(res.online_gateways || [])
        setNameMode(res.config_name_mode === "user" ? "user" : "default")
        setIsAgent(!!res.is_agent)
      })
      .catch(() => { setLoadError(true); toast.error("خطا در دریافت لیست پلن‌ها") })
      .finally(() => setLoading(false))
  }
  useEffect(loadPlans, [])

  // Poll the online invoice every 5s; go to "done" as soon as the bank confirms.
  useEffect(() => {
    if (step !== "online-pay" || !onlinePayment) return
    const interval = setInterval(async () => {
      try {
        const res = await getOnlinePaymentStatus(onlinePayment.paymentId)
        if (res.status === "paid") {
          clearInterval(interval)
          toast.success("پرداخت با موفقیت تأیید شد")
          setStep("done")
        }
      } catch { /* transient network error; retried on next tick */ }
    }, 5000)
    return () => clearInterval(interval)
  }, [step, onlinePayment])

  // Final price must follow the backend logic (best of user code vs. automatic agent discount, VIP only).
  const codePrice = selected
    ? discountMeta?.type === "amount"
      ? Math.max(0, selected.price - discountMeta.amount)
      : Math.round(selected.price * (1 - (discountPercent || 0) / 100))
    : 0
  const agentPrice = selected && selected.type === "vip" && agentPercent > 0 ? Math.round(selected.price * (1 - agentPercent / 100)) : selected?.price ?? 0
  const finalPrice = selected ? Math.min(codePrice, agentPrice) : 0
  const agentDiscountWins = selected ? agentPrice < codePrice : false

  async function checkDiscount() {
    if (!discountCode.trim()) { setDiscountPercent(null); setDiscountMeta(null); return }
    setCheckingDiscount(true)
    try {
      const res = await validateDiscount(discountCode.trim(), selected?.key)
      if (res.valid) {
        if (res.discount_type === "amount") {
          setDiscountMeta({ type: "amount", amount: res.amount || 0 })
          setDiscountPercent(null)
          toast.success(`کد تخفیف ${toman(res.amount || 0)}ی اعمال شد`)
        } else {
          setDiscountMeta({ type: "percent", amount: 0 })
          setDiscountPercent(res.percent || 0)
          toast.success(`کد تخفیف ${faDigits(res.percent || 0)}٪ اعمال شد`)
        }
      } else {
        setDiscountPercent(null)
        setDiscountMeta(null)
        if (res.reason === "wrong_plan") toast.error("این کد روی این پلن قابل استفاده نیست")
        else if (res.reason === "user_limit_reached") toast.error("سهمیه‌ی شما از این کد تمام شده")
        else if (res.reason === "not_allowed") toast.error("شما مجاز به استفاده از این کد تخفیف نیستید")
        else if (res.reason === "min_order_amount") toast.error(`این کد فقط برای سفارش‌های بالای ${toman(res.min_order_amount || 0)} قابل استفاده است`)
        else toast.error("کد تخفیف نامعتبر است")
      }
    } catch {
      toast.error("خطا در بررسی کد تخفیف")
    } finally {
      setCheckingDiscount(false)
    }
  }

  // حالت «نامگذاری توسط کاربر» (فقط VIP و غیرنماینده): نام را اعتبارسنجی و نام نهایی base_12345 را می‌گیرد.
  const nameRequired = nameMode === "user" && !isAgent && selected?.type === "vip"
  async function ensureName(): Promise<{ ok: boolean; name: string | null }> {
    if (!selected || !nameRequired) return { ok: true, name: null }
    if (finalName) return { ok: true, name: finalName }
    const raw = svcName.trim()
    if (!/^[A-Za-z0-9_]{3,26}$/.test(raw)) { toast.error("نام نامعتبر است؛ فقط حروف انگلیسی، عدد و _ (۳ تا ۲۶ نویسه)"); return { ok: false, name: null } }
    try {
      const r = await resolveServiceName(selected.key, raw)
      setFinalName(r.name)
      return { ok: true, name: r.name }
    } catch (e) {
      toast.error(friendlyErrorMessage(e, "خطا در بررسی نام سرویس"))
      return { ok: false, name: null }
    }
  }

  async function payWithWallet() {
    if (!selected) return
    setBusy(true); setBusyKind("wallet")
    try {
      const nm = await ensureName()
      if (!nm.ok) return
      await buyPlanWithWallet(selected.key, discountCode.trim(), nm.name)
      toast.success("خرید با موفقیت انجام شد")
      setStep("done")
    } catch (e) {
      const err = e as ApiError
      if (err.code === "insufficient_balance") toast.error("موجودی کیف پول کافی نیست")
      else if (err.code === "orders_closed") toast.error("بخش سفارشات موقتاً بسته است")
      else toast.error(friendlyErrorMessage(e, "خطا در ثبت خرید"))
    } finally {
      setBusy(false); setBusyKind(null)
    }
  }

  async function startCardPay() {
    if (!selected) return
    setBusy(true); setBusyKind("card")
    try {
      const nm = await ensureName()
      if (!nm.ok) return
      const info = await getCardInfo(selected.key, discountCode.trim(), nm.name)
      setCardInfo(info)
      setReceiptFile(null)
      setStep("card-pay")
    } catch (e) {
      toast.error(friendlyErrorMessage(e, "خطا در دریافت اطلاعات پرداخت"))
    } finally {
      setBusy(false); setBusyKind(null)
    }
  }

  async function startOnlinePay(gw?: OnlineGateway) {
    if (!selected) return
    setBusy(true); setBusyKind("online")
    try {
      const nm = await ensureName()
      if (!nm.ok) return
      const res = await createOnlinePayment(selected.key, discountCode.trim(), { gateway: gw?.key, serviceName: nm.name })
      setOnlinePayment({ paymentId: res.payment_id, paymentLink: res.payment_link, price: res.price, expiresAt: res.expires_at,
        extra: gw ? { title: gw.title, link2: res.payment_link2, infoLines: res.info_lines, tronAmount: res.tron_amount, gateway: res.gateway, paymentId: res.payment_id } : undefined })
      setStep("online-pay")
      openPaymentLink(res.payment_link)
    } catch (e) {
      const err = e as ApiError
      if (err.code === "amount_too_low") toast.error("برای مبالغ ۵۰ هزار تومان و کمتر امکان استفاده از درگاه پرداخت آنلاین نیست. لطفاً از کارت‌به‌کارت یا کیف پول استفاده کنید.")
      else toast.error(friendlyErrorMessage(e, "خطا در اتصال به درگاه پرداخت"))
    } finally {
      setBusy(false); setBusyKind(null)
    }
  }

  async function checkOnlinePayment() {
    if (!onlinePayment) return
    setBusy(true)
    try {
      const res = await getOnlinePaymentStatus(onlinePayment.paymentId)
      if (res.status === "paid") {
        toast.success("پرداخت با موفقیت تأیید شد")
        setStep("done")
      } else {
        toast.error("هنوز پرداختی برای این تراکنش ثبت نشده؛ چند لحظه بعد دوباره امتحان کنید")
      }
    } catch {
      toast.error("خطا در بررسی وضعیت پرداخت")
    } finally {
      setBusy(false)
    }
  }

  async function submitReceipt() {
    if (!selected || !receiptFile) return
    setBusy(true)
    try {
      await uploadPlanReceipt(selected.key, discountCode.trim(), receiptFile, cardInfo?.invoice_id, finalName)
      toast.success("رسید ارسال شد؛ پس از تأیید ادمین سرویس برایتان ارسال می‌شود")
      setStep("done")
    } catch (e) {
      toast.error(friendlyErrorMessage(e, "خطا در ارسال رسید"))
    } finally {
      setBusy(false)
    }
  }

  function openPlan(plan: Plan) {
    if (!ordersEnabled) return
    setSelected(plan)
    setDiscountCode("")
    setDiscountPercent(null)
    setDiscountMeta(null)
    setSvcName("")
    setFinalName(null)
    setStep("checkout")
  }

  /* ---------------- done ---------------- */
  if (step === "done") {
    return (
      <div className="x-page">
        <StepIndicator step={3} total={3} label="تکمیل" />
        <DoneScreen text="نتیجه به‌زودی برایتان اطلاع‌رسانی می‌شود." />
      </div>
    )
  }

  /* ---------------- online gateway ---------------- */
  if (step === "online-pay" && selected && onlinePayment) {
    return (
      <div className="x-page">
        <PageTop title="پرداخت آنلاین" back={false} />
        <StepIndicator step={2} total={3} label="پرداخت" />
        <OnlineGatewayCardWithTimer
          expiresAt={onlinePayment.expiresAt}
          onExpire={() => { toast.error("مهلت پرداخت این فاکتور به پایان رسید. لطفاً دوباره سفارش دهید."); setOnlinePayment(null); setStep("checkout") }}
          planName={selected.name}
          price={onlinePayment.price}
          link={onlinePayment.paymentLink}
          extra={onlinePayment.extra}
        />
        <StickyBar>
          <Button variant="ok" size="lg" full loading={busy} icon={<RefreshCw size={17} />} onClick={checkOnlinePayment}>پرداخت را انجام دادم / بررسی کن</Button>
          <Button variant="ghost" full onClick={() => setStep("checkout")}>بازگشت</Button>
        </StickyBar>
      </div>
    )
  }

  /* ---------------- card to card ---------------- */
  if (step === "card-pay" && selected && cardInfo) {
    return (
      <div className="x-page">
        <PageTop title="کارت‌به‌کارت" back={false} />
        <StepIndicator step={2} total={3} label="پرداخت" />
        <CardInfoCard
          cardNumber={cardInfo.card_number}
          holder={cardInfo.card_holder}
          price={cardInfo.price}
          expiresAt={cardInfo.expires_at}
          onExpire={() => { toast.error("مهلت پرداخت این فاکتور به پایان رسید. لطفاً دوباره سفارش دهید."); setCardInfo(null); setStep("checkout") }}
        />
        <Section title="رسید پرداخت">
          <ReceiptPicker file={receiptFile} onChange={setReceiptFile} />
        </Section>
        <StickyBar>
          <Button variant="primary" size="lg" full disabled={!receiptFile} loading={busy} onClick={submitReceipt}>ارسال رسید برای تأیید</Button>
          <Button variant="ghost" full onClick={() => setStep("checkout")}>بازگشت</Button>
        </StickyBar>
      </div>
    )
  }

  /* ---------------- checkout ---------------- */
  if (step === "checkout" && selected) {
    const summary = agentDiscountWins && agentPercent > 0
      ? null
      : discountMeta?.type === "amount" ? `${toman(discountMeta.amount)} تخفیف` : discountPercent ? `${faDigits(discountPercent)}٪ تخفیف` : null
    return (
      <div className="x-page">
        <PageTop title="تکمیل خرید" back={false} />
        <StepIndicator step={1} total={3} label="انتخاب" />
        <Card hero>
          <div className="x-row-flex">
            <Tile size="lg" tone="blue" icon={<Package size={22} />} />
            <div className="x-grow">
              <div className="x-h2 x-ellipsis">{selected.name}</div>
              <div className="x-sub">{formatDays(selected.days)}{selected.volume_gb ? ` · ${faDigits(selected.volume_gb)} گیگابایت` : ""}</div>
            </div>
          </div>
        </Card>

        {nameRequired && (
          <Card>
            <Input label="نام سرویس" ltr placeholder="مثلاً ali" value={svcName}
              onChange={(e) => { setSvcName(e.target.value.replace(/[^A-Za-z0-9_]/g, "")); setFinalName(null) }} />
            <div className="x-sub" style={{ marginTop: 6 }}>فقط حروف انگلیسی، عدد و _ (۳ تا ۲۶ نویسه). یک کد ۵ رقمی به انتهای نام اضافه می‌شود.</div>
          </Card>
        )}

        {selected.price > 0 && <DiscountField value={discountCode} onChange={setDiscountCode} onApply={checkDiscount} loading={checkingDiscount} summary={summary} />}

        <Card>
          <KV k="قیمت پایه" v={toman(selected.price)} />
          {finalPrice < selected.price && agentDiscountWins ? (
            <KV k="تخفیف نمایندگی" v={<span style={{ color: "var(--ok)" }}>{faDigits(agentPercent)}٪ −</span>} />
          ) : discountMeta?.type === "amount" ? (
            <KV k="تخفیف" v={<span style={{ color: "var(--ok)" }}>{toman(discountMeta.amount)} −</span>} />
          ) : discountPercent ? (
            <KV k="تخفیف" v={<span style={{ color: "var(--ok)" }}>{faDigits(discountPercent)}٪ −</span>} />
          ) : null}
          <div className="x-divider" />
          <div className="x-between" style={{ paddingTop: 6 }}>
            <span className="x-h3">مبلغ نهایی</span>
            <span className="x-h2 x-grad-text num">{toman(finalPrice)}</span>
          </div>
        </Card>

        <StickyBar>
          {finalPrice <= 0 ? (
            <Button variant="primary" size="lg" full loading={busy && busyKind === "wallet"} disabled={busy} icon={<Sparkles size={18} />} onClick={payWithWallet}>🎁 دریافت رایگان</Button>
          ) : (<>
          <Button variant="primary" size="lg" full loading={busy && busyKind === "wallet"} disabled={busy && busyKind !== "wallet"} icon={<WalletIcon size={18} />} onClick={payWithWallet}>پرداخت از کیف پول</Button>
          <div className={onlinePaymentEnabled || gateways.length ? "x-grid c2" : "x-grid"}>
            {onlinePaymentEnabled && (
              <Button full loading={busy && busyKind === "online"} disabled={busy && busyKind !== "online"} icon={<Globe2 size={16} />} onClick={() => startOnlinePay()}>آنلاین</Button>
            )}
            {gateways.map((gw) => (
              <Button key={gw.key} full loading={busy && busyKind === "online"} disabled={busy && busyKind !== "online"} icon={<Globe2 size={16} />} onClick={() => startOnlinePay(gw)}>{gw.title}</Button>
            ))}
            <Button full loading={busy && busyKind === "card"} disabled={busy && busyKind !== "card"} icon={<CreditCard size={16} />} onClick={startCardPay}>کارت‌به‌کارت</Button>
          </div>
          </>)}
          <Button variant="ghost" size="sm" full onClick={() => setStep("list")}>بازگشت به لیست پلن‌ها</Button>
        </StickyBar>
      </div>
    )
  }

  /* ---------------- list ---------------- */
  const list = activeCategory ? activeCategory.plans : []
  const bestKey = list.length > 1 ? list.reduce((a, b) => (b.days > a.days ? b : a)).key : null

  return (
    <div className="x-page">
      <PageTop
        title={activeCategory ? activeCategory.name : "خرید اشتراک"}
        sub={activeCategory ? "یک پلن انتخاب کنید" : "سرویس VIP"}
        back={activeCategory ? false : "/"}
        right={activeCategory ? <Button size="sm" onClick={() => setActiveCategory(null)}>دسته‌ها</Button> : undefined}
      />

      {!ordersEnabled && <Alert tone="bad">ربات به دلیل حجم سفارشات بالا موقتاً بسته است. روشن شدن دوباره‌ی آن اطلاع‌رسانی خواهد شد.</Alert>}

      {agentPercent > 0 && (
        <Alert tone="ok">به‌عنوان نماینده، {faDigits(agentPercent)}٪ تخفیف خودکار روی همه‌ی پلن‌های VIP دارید.</Alert>
      )}

      {!activeCategory && customBuildOn && (
        <Card tap onClick={() => ordersEnabled && navigate("/custom-build")}>
          <div className="x-row-flex">
            <Tile tone="violet" icon={<Wrench size={19} />} />
            <div className="x-grow">
              <div className="x-h3">کانفیگ خودتان را بسازید</div>
              <div className="x-muted">حجم و مدت دلخواه را خودتان انتخاب کنید</div>
            </div>
            <Sparkles size={17} color="var(--accent)" />
          </div>
        </Card>
      )}

      {loading ? (
        <div className="x-stack">
          {[0, 1, 2].map((i) => <Skeleton key={i} height={68} radius={22} />)}
        </div>
      ) : loadError ? (
        <>
          <Alert tone="bad">دریافت لیست پلن‌ها ناموفق بود.</Alert>
          <Button icon={<RefreshCw size={16} />} onClick={loadPlans}>تلاش مجدد</Button>
        </>
      ) : !activeCategory ? (
        vipCategories.length === 0 ? (
          <Empty icon={<Layers size={34} strokeWidth={1.5} />} title="دسته‌بندی‌ای وجود ندارد" sub="فعلاً دسته‌بندی‌ای برای VIP تعریف نشده است." />
        ) : (
          <Section title="دسته‌بندی‌ها">
            {vipCategories.map((cat) => {
              const cheapest = cat.plans.length ? Math.min(...cat.plans.map((p) => p.price)) : 0
              return (
                <ChoiceCard
                  key={cat.key}
                  icon={<Layers size={19} />}
                  tone="blue"
                  title={cat.name}
                  sub={`${num(cat.plans.length)} پلن${cheapest ? ` · از ${toman(cheapest)}` : ""}`}
                  onClick={() => setActiveCategory(cat)}
                />
              )
            })}
          </Section>
        )
      ) : list.length === 0 ? (
        <Empty icon={<Package size={34} strokeWidth={1.5} />} title="پلنی وجود ندارد" sub="فعلاً پلنی برای این بخش تعریف نشده است." />
      ) : (
        <Section>
          {list.map((plan) => {
            const best = plan.key === bestKey
            return (
              <Card key={plan.key} tap onClick={() => openPlan(plan)} style={best ? { borderColor: "color-mix(in srgb,var(--gold, #f5b84a) 55%, transparent)" } : undefined}>
                <div className="x-row-flex">
                  <Tile tone={best ? "gold" : "blue"} icon={best ? <Crown size={19} /> : <Package size={19} />} />
                  <div className="x-grow">
                    <div className="x-h3 x-fulltext">{plan.name}</div>
                    <div className="x-muted">{formatDays(plan.days)}{plan.volume_gb ? ` · ${faDigits(plan.volume_gb)} گیگابایت` : ""}</div>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div className="x-h3 num">{toman(plan.price)}</div>
                    {best && <Chip tone="warn" icon={<Crown size={12} />}>پیشنهاد ویژه</Chip>}
                  </div>
                </div>
              </Card>
            )
          })}
        </Section>
      )}
    </div>
  )
}

/** Gateway body with optional invoice countdown. */
function OnlineGatewayCardWithTimer({ expiresAt, onExpire, planName, price, link, extra }: { expiresAt?: string; onExpire: () => void; planName: string; price: number; link: string; extra?: GatewayExtra }) {
  return (
    <>
      {expiresAt && <ExpiryCountdownLazy expiresAt={expiresAt} onExpire={onExpire} />}
      <OnlineGatewayCard
        price={price}
        link={link}
        planName={planName}
        extra={extra}
        text="روی دکمه‌ی «رفتن به درگاه پرداخت» بزنید و مبلغ را واریز کنید. به‌محض تأیید بانک، سفارش شما به‌صورت خودکار ثبت می‌شود؛ در صورت نیاز می‌توانید وضعیت را دستی هم بررسی کنید."
      />
    </>
  )
}
