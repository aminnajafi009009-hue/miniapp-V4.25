import { txMeta, TxAmount } from "@/shared/lib/tx"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import WebApp from "@twa-dev/sdk"
import { CreditCard, Globe2, Lock, Plus, Tag, Wallet as WalletIcon, CheckCircle2 } from "lucide-react"
import { createCryptoInvoice, createWalletCardInvoice, getCryptoCoins, submitCryptoReceipt, type CryptoCoin, createWalletOnlinePayment, getOnlinePaymentStatus, getWallet, topupWallet } from "@/shared/api/services"
import type { Wallet as WalletType } from "@/shared/api/types"
import { ApiError, friendlyErrorMessage } from "@/shared/api/client"
import { Alert, Button, Card, Chip, Empty, Input, List, PageSkeleton, PageTop, Row, Section } from "@/shared/ui/kit"
import { CardInfoCard, ChoiceCard, CopyRow, OnlineGatewayCard, ReceiptPicker, StickyBar, type GatewayExtra } from "@/shared/ui/purchase"
import { faDigits, toman } from "@/shared/lib/format"

const QUICK = [50000, 100000, 200000, 500000]
const DEFAULT_ONLINE_MIN = 50000
type Step = "amount" | "method" | "card" | "online" | "coin" | "crypto"

export default function WalletPage() {
  const nav = useNavigate()
  const [data, setData] = useState<WalletType | null>(null)
  const [failed, setFailed] = useState(false)
  const [step, setStep] = useState<Step | null>(null)
  const [amount, setAmount] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [online, setOnline] = useState<{ paymentId: number; link: string; price: number; expiresAt?: string; extra?: GatewayExtra } | null>(null)
  const [coins, setCoins] = useState<CryptoCoin[]>([])
  const [cx, setCx] = useState<{ invoiceId: number; expiresAt: string; symbol: string; network: string; wallet: string; amountAsset: string } | null>(null)
  const [hash, setHash] = useState("")
  const [inv, setInv] = useState<{ invoiceId: number; expiresAt: string; cardNumber: string; cardHolder: string } | null>(null)

  const load = () => { getWallet().then((d) => { setData(d); setFailed(false) }).catch(() => setFailed(true)) }
  useEffect(load, [])

  useEffect(() => {
    if (step !== "online" || !online) return
    const t = setInterval(async () => {
      try {
        const r = await getOnlinePaymentStatus(online.paymentId)
        if (r.status === "paid") { clearInterval(t); toast.success("کیف پول شما شارژ شد"); reset(); load() }
      } catch { /* retry */ }
    }, 5000)
    return () => clearInterval(t)
  }, [step, online])

  const reset = () => { setCx(null); setHash(""); setStep(null); setAmount(""); setFile(null); setOnline(null); setInv(null) }
  const minOnline = data?.online_payment_min_amount ?? DEFAULT_ONLINE_MIN
  const tm = data?.topup_methods
  const hasOnline = !!data?.online_payment_enabled && (!tm || tm.includes("online"))
  const hasCard = !tm || tm.includes("card")
  const hasCrypto = !!tm && tm.includes("crypto")
  const gws = (data?.online_gateways || []).filter((g) => Number(amount) >= g.min_amount)
  const nMethods = (hasOnline && Number(amount) > minOnline ? 1 : 0) + gws.length + (hasCard ? 1 : 0) + (hasCrypto ? 1 : 0)
  const eligible = nMethods !== 1 || !hasCard
  const amt = Number(amount)

  async function toCard() {
    if (!amt) return
    setBusy(true)
    try { const r = await createWalletCardInvoice(amt); setInv({ invoiceId: r.invoice_id, expiresAt: r.expires_at, cardNumber: r.card_number, cardHolder: r.card_holder }); setFile(null); setStep("card") }
    catch (e) { toast.error(friendlyErrorMessage(e, "خطا در ایجاد فاکتور شارژ")) } finally { setBusy(false) }
  }
  async function submit() {
    if (!amt || !file) return
    setBusy(true)
    try { await topupWallet(amt, file, inv?.invoiceId); toast.success("رسید ثبت شد. پس از تأیید ادمین کیف پول شارژ می‌شود."); reset(); load() }
    catch (e) { toast.error(friendlyErrorMessage(e, "خطا در ارسال رسید")) } finally { setBusy(false) }
  }
  async function toOnline(gateway?: string, gwTitle?: string) {
    if (!amt) return
    setBusy(true)
    try {
      const r = await createWalletOnlinePayment(amt, gateway)
      setOnline({ paymentId: r.payment_id, link: r.payment_link, price: r.price, expiresAt: r.expires_at, extra: gateway ? { title: gwTitle, link2: r.payment_link2, infoLines: r.info_lines, tronAmount: r.tron_amount, gateway: r.gateway, paymentId: r.payment_id } : undefined }); setStep("online")
      try { WebApp.openLink(r.payment_link) } catch { window.open(r.payment_link, "_blank") }
    } catch (e) {
      const c = (e as ApiError).code
      toast.error(c === "amount_too_low" ? "برای مبالغ ۵۰ هزار تومان و کمتر درگاه آنلاین فعال نیست؛ از کارت‌به‌کارت استفاده کنید." : friendlyErrorMessage(e, "خطا در اتصال به درگاه پرداخت"))
    } finally { setBusy(false) }
  }
  async function toCoins() {
    setBusy(true)
    try { const r = await getCryptoCoins(); if (!r.coins.length) { toast.error("ارز فعالی برای پرداخت تنظیم نشده است"); return } setCoins(r.coins); setStep("coin") }
    catch (e) { toast.error(friendlyErrorMessage(e, "دریافت ارزها ناموفق بود")) } finally { setBusy(false) }
  }
  async function pickCoin(c: CryptoCoin) {
    setBusy(true)
    try { const r = await createCryptoInvoice(amt, c.symbol); setCx({ invoiceId: r.invoice_id, expiresAt: r.expires_at, symbol: r.symbol, network: r.network, wallet: r.wallet, amountAsset: r.amount_asset }); setFile(null); setHash(""); setStep("crypto") }
    catch (e) { toast.error(friendlyErrorMessage(e, "ساخت فاکتور ارزی ناموفق بود")) } finally { setBusy(false) }
  }
  async function submitCrypto() {
    if (!cx || (!file && hash.trim().length < 8)) return
    setBusy(true)
    try { await submitCryptoReceipt(cx.invoiceId, file, hash.trim()); toast.success("رسید ثبت شد. پس از تأیید ادمین کیف پول شارژ می‌شود."); reset(); load() }
    catch (e) { toast.error(friendlyErrorMessage(e, "خطا در ارسال رسید")) } finally { setBusy(false) }
  }
  async function check() {
    if (!online) return
    setBusy(true)
    try {
      const r = await getOnlinePaymentStatus(online.paymentId)
      if (r.status === "paid") { toast.success("کیف پول شما شارژ شد"); reset(); load() }
      else toast.error("هنوز پرداختی ثبت نشده؛ چند لحظه بعد دوباره امتحان کنید")
    } catch { toast.error("خطا در بررسی وضعیت پرداخت") } finally { setBusy(false) }
  }

  if (failed) return <div className="x-page"><PageTop title="کیف پول" /><Alert tone="bad">دریافت اطلاعات کیف پول ناموفق بود.</Alert><Button onClick={load}>تلاش مجدد</Button></div>
  if (!data) return <div className="x-page"><PageTop title="کیف پول" /><PageSkeleton /></div>

  if (step === "online" && online) return (
    <div className="x-page">
      <PageTop title="پرداخت آنلاین" back={false} />
      <OnlineGatewayCard price={online.price} link={online.link} extra={online.extra} text="پس از پرداخت، کیف پول به‌صورت خودکار شارژ می‌شود." />
      <StickyBar>
        <Button variant="primary" size="lg" full loading={busy} icon={<CheckCircle2 size={17} />} onClick={check}>پرداخت را انجام دادم</Button>
        <Button variant="ghost" full onClick={() => setStep("method")}>بازگشت</Button>
      </StickyBar>
    </div>
  )

  if (step === "coin") return (
    <div className="x-page">
      <PageTop title="ارز دیجیتال" sub={toman(amt)} back={false} />
      <div className="x-stack">{coins.map((c) => <ChoiceCard key={c.symbol + c.network} icon={<Globe2 size={19} />} tone="gold" title={`${c.symbol}${c.network ? ` (${c.network})` : ""}`} sub={c.name} onClick={() => pickCoin(c)} />)}</div>
      <Button variant="ghost" full onClick={() => setStep("method")}>بازگشت</Button>
    </div>
  )

  if (step === "crypto" && cx) return (
    <div className="x-page">
      <PageTop title="پرداخت ارزی" sub={toman(amt)} back={false} />
      <Card><div className="x-stack">
        <CopyRow label={`مبلغ قابل پرداخت (${cx.symbol})`} value={cx.amountAsset} mono />
        <CopyRow label={`آدرس کیف پول${cx.network ? ` — شبکه ${cx.network}` : ""}`} value={cx.wallet} shown={cx.wallet} />
        <div className="x-muted">این فاکتور ۳۰ دقیقه معتبر است. پس از واریز، عکس رسید یا هش تراکنش را ارسال کنید.</div>
      </div></Card>
      <ReceiptPicker file={file} onChange={setFile} />
      <Input label="یا هش تراکنش" ltr value={hash} onChange={(e) => setHash(e.target.value)} />
      <StickyBar>
        <Button variant="primary" size="lg" full disabled={!file && hash.trim().length < 8} loading={busy} onClick={submitCrypto}>ارسال رسید برای تأیید</Button>
        <Button variant="ghost" full onClick={() => setStep("coin")}>بازگشت</Button>
      </StickyBar>
    </div>
  )

  if (step === "method") return (
    <div className="x-page">
      <PageTop title="روش پرداخت" sub={toman(amt)} back={false} />
      <div className="x-stack">
        {hasOnline && amt > minOnline && <ChoiceCard icon={<Globe2 size={19} />} tone="info" title="پرداخت آنلاین" sub="تأیید خودکار" onClick={() => toOnline()} />}
        {gws.map((g) => <ChoiceCard key={g.key} icon={<Globe2 size={19} />} tone="info" title={`پرداخت آنلاین (${g.title})`} sub="تأیید خودکار" onClick={() => toOnline(g.key, g.title)} />)}
        {hasCard && <ChoiceCard icon={<CreditCard size={19} />} tone="violet" title="کارت‌به‌کارت" sub="نیازمند تأیید ادمین" onClick={toCard} />}
        {hasCrypto && <ChoiceCard icon={<Globe2 size={19} />} tone="gold" title="ارز دیجیتال" sub="نیازمند تأیید ادمین" onClick={toCoins} />}
      </div>
      <Button variant="ghost" full onClick={() => setStep("amount")}>بازگشت</Button>
    </div>
  )

  if (step === "card") return (
    <div className="x-page">
      <PageTop title="کارت‌به‌کارت" back={false} />
      <CardInfoCard cardNumber={inv?.cardNumber ?? data.card_number} holder={inv?.cardHolder ?? data.card_holder} price={amt} expiresAt={inv?.expiresAt}
        onExpire={() => { toast.error("مهلت این فاکتور به پایان رسید؛ دوباره شروع کنید."); setInv(null); setStep(eligible ? "method" : "amount") }} />
      <ReceiptPicker file={file} onChange={setFile} />
      <StickyBar>
        <Button variant="primary" size="lg" full disabled={!file} loading={busy} onClick={submit}>ارسال رسید برای تأیید</Button>
        <Button variant="ghost" full onClick={() => { setInv(null); setStep(eligible ? "method" : "amount") }}>بازگشت</Button>
      </StickyBar>
    </div>
  )

  if (step === "amount") return (
    <div className="x-page">
      <PageTop title="شارژ کیف پول" back={false} />
      <Input label="مبلغ (تومان)" type="number" inputMode="numeric" placeholder="100000" value={amount} onChange={(e) => setAmount(e.target.value)} />
      {!!data.gift_percent && data.gift_percent > 0 && (
        <Alert tone="ok">🎁 با هر شارژ {faDigits(data.gift_percent)}٪ هدیه می‌گیرید{amt > 0 ? ` (حدود ${toman(Math.floor(amt * data.gift_percent / 100))})` : ""}.</Alert>
      )}
      <div className="x-row-flex" style={{ flexWrap: "wrap" }}>
        {QUICK.map((a) => <Chip key={a} onClick={() => setAmount(String(a))}>{toman(a)}</Chip>)}
      </div>
      <StickyBar>
        <Button variant="primary" size="lg" full disabled={!amt} loading={busy} onClick={() => (nMethods === 0 ? toast.error("روش پرداختی برای این مبلغ فعال نیست") : eligible ? setStep("method") : toCard())}>ادامه</Button>
        <Button variant="ghost" full onClick={reset}>انصراف</Button>
      </StickyBar>
    </div>
  )

  return (
    <div className="x-page">
      <PageTop title="کیف پول" />
      <Card hero>
        <div className="x-stack" style={{ gap: 10 }}>
          <div className="x-row-flex"><WalletIcon size={18} /><span className="x-sub">موجودی قابل استفاده</span></div>
          <div className="x-h1 num">{toman(data.wallet)}</div>
          {data.locked_wallet > 0 && data.referral_enabled !== false && <div className="x-chip warn" style={{ alignSelf: "flex-start" }}><Lock size={13} />در انتظار: {toman(data.locked_wallet)}</div>}
          <div className="x-row-flex">
            <Button variant="primary" icon={<Plus size={17} />} onClick={() => setStep("amount")}>شارژ کیف پول</Button>
            <Button icon={<Tag size={16} />} onClick={() => nav("/discount")}>کد تخفیف</Button>
          </div>
        </div>
      </Card>
      {data.locked_wallet > 0 && data.referral_enabled !== false && <Alert tone="warn">{data.referral_rule === "paid" ? "موجودی در انتظار پس از اولین خرید پولی فردِ دعوت‌شده با لینک شما، خودکار آزاد می‌شود." : `موجودی در انتظار پس از خرید حداقل ${faDigits(data.min_purchase_gb)} گیگ توسط فردِ دعوت‌شده با لینک شما، خودکار آزاد می‌شود.`}</Alert>}
      <Section title="تراکنش‌های من">
        {data.transactions.length === 0 ? <Empty title="هنوز تراکنشی ندارید" /> : (
          <List>
            {data.transactions.map((tx, i) => (
              <Row key={i} icon={txMeta(tx).icon} tone={txMeta(tx).tone}
                title={tx.description} sub={tx.created_at}
                right={<TxAmount t={tx} />} />
            ))}
          </List>
        )}
      </Section>
    </div>
  )
}
