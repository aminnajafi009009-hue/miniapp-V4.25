import { cardFlags } from "@/shared/api/cardFlags"
import { ReactNode, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import WebApp from "@twa-dev/sdk"
import { Check, CheckCircle2, ChevronLeft, Clock, Copy, Globe2, ImagePlus, Tag, User, Wallet as WalletIcon, XCircle } from "lucide-react"
import { Alert, Button, Card, Input, KV, Tile, type Tone } from "@/shared/ui/kit"
import { getOnlinePaymentStatus, tonpaysRegisterRefund, tonpaysSendRemainder, type OnlineStatus } from "@/shared/api/services"
import { ExpiryCountdown } from "@/shared/ui/ExpiryCountdown"
import { copyText, faDigits, toman } from "@/shared/lib/format"
import { hapticNotification } from "@/shared/haptics"

/** Sticky bottom action bar (sits above the bottom nav). Always occupies the same space => no layout jump. */
export function StickyBar({ children }: { children: ReactNode }) {
  return (
    <div className="x-stack" style={{
      position: "sticky", bottom: "calc(var(--nav-h) + var(--safe-b) + 24px)", zIndex: 5, gap: 8,
      padding: 10, borderRadius: 22, background: "var(--solid)", border: "1px solid var(--line-2)", boxShadow: "var(--shadow-3)",
    }}>{children}</div>
  )
}

/** Full-screen status (success / pending / expired / failed). */
export function StatusScreen({ tone = "ok", icon, title, text, children }: { tone?: "ok" | "warn" | "bad" | "info"; icon?: ReactNode; title: string; text?: string; children?: ReactNode }) {
  useEffect(() => { hapticNotification(tone === "ok" ? "success" : tone === "bad" ? "error" : "warning") }, [tone])
  const I = tone === "bad" ? XCircle : tone === "warn" || tone === "info" ? Clock : CheckCircle2
  return (
    <>
      <Card hero>
        <div className="x-stack" style={{ alignItems: "center", textAlign: "center", padding: "18px 6px", gap: 10 }}>
          <Tile size="lg" tone={tone} icon={icon ?? <I size={26} />} />
          <div className="x-h2">{title}</div>
          {text && <div className="x-sub">{text}</div>}
        </div>
      </Card>
      {children}
    </>
  )
}

/** Standard "done" screen with the two usual actions. */
export function DoneScreen({ text, pending = true }: { text: string; pending?: boolean }) {
  const nav = useNavigate()
  return (
    <>
      <StatusScreen tone={pending ? "info" : "ok"} title="ثبت شد" text={text} />
      <div className="x-stack">
        <Button variant="primary" size="lg" full onClick={() => nav("/services")}>مشاهده سرویس‌های من</Button>
        <Button variant="ghost" full onClick={() => nav("/")}>بازگشت به خانه</Button>
      </div>
    </>
  )
}

/** Selectable card (plan / option / mode). */
export function ChoiceCard({ icon, tone, title, sub, right, on, onClick }: { icon?: ReactNode; tone?: Tone; title: ReactNode; sub?: ReactNode; right?: ReactNode; on?: boolean; onClick: () => void }) {
  return (
    <Card tap onClick={onClick} style={on ? { borderColor: "var(--accent)", background: "var(--accent-soft)" } : undefined}>
      <div className="x-row-flex">
        {icon && <Tile icon={icon} tone={tone} />}
        <div className="x-grow"><div className="x-h3 x-fulltext">{title}</div>{sub && <div className="x-muted x-fulltext">{sub}</div>}</div>
        {right ?? (on ? <Check size={18} color="var(--accent)" /> : <ChevronLeft size={17} color="var(--text-3)" />)}
      </div>
    </Card>
  )
}

/** Copy-able value row. */
export function CopyRow({ label, value, shown, mono = true, copy = true }: { label: string; value: string; shown?: string; mono?: boolean; copy?: boolean }) {
  return (
    <div className="x-between" style={{ padding: "6px 0" }}>
      <div className="x-grow">
        <div className="x-muted">{label}</div>
        <div className={mono ? "mono num" : "num"} style={{ fontSize: 17, fontWeight: 700, letterSpacing: mono ? 1 : 0, textAlign: "right" }}>{shown ?? value}</div>
      </div>
      {copy && <Button size="sm" icon={<Copy size={14} />} onClick={async () => { (await copyText(value)) ? toast.success("کپی شد") : toast.error("کپی نشد") }}>کپی</Button>}
    </div>
  )
}

export function openPaymentLink(link: string) {
  // لینک t.me (حالت «پرداخت داخل تلگرام») باید با openTelegramLink باز شود، لینک وب با openLink
  try { if (/^https:\/\/t\.me\//i.test(link)) WebApp.openTelegramLink(link); else WebApp.openLink(link) } catch { window.open(link, "_blank") }
}

/** Receipt picker with image preview (object URL revoked on change). */
export function ReceiptPicker({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  return (
    <div className="x-stack">
      {url && <img src={url} alt="پیش‌نمایش رسید" style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 14, background: "var(--s1)" }} />}
      <label className="x-card flat tap" style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", borderStyle: "dashed", minHeight: 52, cursor: "pointer" }}>
        {file ? <CheckCircle2 size={18} color="var(--ok)" /> : <ImagePlus size={18} />}
        <span className="x-ellipsis" style={{ fontWeight: 500 }}>{file ? file.name : "انتخاب عکس رسید"}</span>
        <input type="file" accept="image/*" hidden onChange={(e) => onChange(e.target.files?.[0] || null)} />
      </label>
    </div>
  )
}

/** Card-to-card payment info + countdown. */
export function CardInfoCard({ cardNumber, holder, price, expiresAt, onExpire }: { cardNumber: string; holder: string; price?: number; expiresAt?: string; onExpire?: () => void }) {
  return (
    <>
      {expiresAt && <ExpiryCountdown expiresAt={expiresAt} onExpire={onExpire} />}
      <Card hero>
        <CopyRow label="شماره کارت" value={cardNumber} shown={faDigits(cardNumber)} copy={cardFlags.copyCard} />
        <div className="x-divider" />
        <KV k={<span className="x-row-flex"><User size={14} />به نام</span>} v={holder} />
        {price != null && <CopyRow label="مبلغ (تومان)" value={String(price)} shown={toman(price)} mono={false} copy={cardFlags.copyAmount} />}
      </Card>
    </>
  )
}

/** TonPays: مبلغ کمتر (ارسال رسید مابقی) / مبلغ بیشتر (ثبت کارت عودت). فقط وقتی لازم باشد نمایش داده می‌شود. */
export function TonPaysAction({ paymentId }: { paymentId: number }) {
  const [st, setSt] = useState<OnlineStatus | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [card, setCard] = useState("")
  const [holder, setHolder] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    let alive = true
    const tick = async () => { try { const r = await getOnlinePaymentStatus(paymentId); if (alive) setSt(r) } catch { /* retry */ } }
    tick()
    const t = setInterval(tick, 10000)
    return () => { alive = false; clearInterval(t) }
  }, [paymentId])

  if (!st || !st.action) return null
  const done = sent || !!st.done
  async function sendRemainder() {
    if (!file) return
    setBusy(true)
    try { await tonpaysSendRemainder(paymentId, file); setSent(true); toast.success("رسید مابقی ثبت شد") }
    catch { toast.error("ارسال رسید ناموفق بود؛ دوباره تلاش کنید") } finally { setBusy(false) }
  }
  async function sendRefund() {
    if (card.replace(/\D/g, "").length !== 16 || holder.trim().length < 3) { toast.error("شماره کارت ۱۶ رقمی و نام صاحب کارت را کامل وارد کنید"); return }
    setBusy(true)
    try { await tonpaysRegisterRefund(paymentId, card, holder.trim()); setSent(true); toast.success("کارت عودت ثبت شد") }
    catch { toast.error("ثبت کارت ناموفق بود؛ دوباره تلاش کنید") } finally { setBusy(false) }
  }
  return (
    <Card>
      <div className="x-stack">
        <Alert tone="warn">{st.action === "less" ? "مبلغ کمتر از فاکتور واریز شده است." : "مبلغ بیشتر از فاکتور واریز شده است."}</Alert>
        {st.action === "less" ? (
          <>
            {st.remaining_amount ? <KV k="مابقی" v={toman(Number(st.remaining_amount))} /> : null}
            {st.remaining_card_number ? <CopyRow label="کارت مقصد مابقی" value={String(st.remaining_card_number)} shown={faDigits(String(st.remaining_card_number))} copy /> : null}
            {st.remaining_card_holder ? <KV k="به نام" v={st.remaining_card_holder} /> : null}
            {done ? <div className="x-sub">✅ رسید مابقی ثبت شده و در انتظار تأیید است.</div> : (
              <>
                <div className="x-sub">مابقی را واریز کنید؛ تأیید خودکار است. اگر تأیید نشد، رسید مابقی را اینجا بفرستید.</div>
                <ReceiptPicker file={file} onChange={setFile} />
                <Button variant="primary" full loading={busy} onClick={sendRemainder}>ارسال رسید مابقی</Button>
              </>
            )}
          </>
        ) : (
          <>
            {st.refund_amount ? <KV k="مازاد قابل عودت" v={toman(Number(st.refund_amount))} /> : null}
            {done ? <div className="x-sub">✅ کارت عودت ثبت شده؛ مازاد توسط تون‌پیز واریز می‌شود.</div> : (
              <>
                <div className="x-sub">برای تأیید سفارش، کارت خودتان را برای عودت مازاد ثبت کنید.</div>
                <Input label="شماره کارت (۱۶ رقم)" ltr value={card} onChange={(e) => setCard(e.target.value)} />
                <Input label="نام صاحب کارت" value={holder} onChange={(e) => setHolder(e.target.value)} />
                <Button variant="primary" full loading={busy} onClick={sendRefund}>ثبت کارت عودت</Button>
              </>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

/** Online gateway step body. */
export interface GatewayExtra { gateway?: string | null; paymentId?: number; title?: string | null; link2?: string | null; infoLines?: string[] | null; tronAmount?: number | null }
export function OnlineGatewayCard({ price, link, text, planName, extra }: { price: number; link: string; text: string; planName?: string; extra?: GatewayExtra }) {
  return (
    <>
    <Card>
      <div className="x-stack">
        <div className="x-row-flex"><Tile tone="info" icon={<Globe2 size={19} />} /><div className="x-grow"><div className="x-h3">{extra?.title ? `پرداخت آنلاین (${extra.title})` : "پرداخت آنلاین"}</div><div className="x-muted">تأیید خودکار</div></div></div>
        {planName && <KV k="پلن" v={planName} />}
        <KV k="مبلغ" v={toman(price)} />
        {extra?.tronAmount ? <KV k="مبلغ ترون" v={`${extra.tronAmount} TRX`} /> : null}
        {extra?.infoLines && extra.infoLines.length > 0 && (
          <div className="x-stack" style={{ gap: 4 }}>{extra.infoLines.map((l, i) => <div key={i} className="x-sub">{l}</div>)}</div>
        )}
        <div className="x-sub">{text}</div>
        <Button variant="primary" full icon={<Globe2 size={17} />} onClick={() => openPaymentLink(link)}>رفتن به درگاه پرداخت</Button>
        {extra?.link2 && <Button full icon={<Globe2 size={16} />} onClick={() => openPaymentLink(extra.link2 as string)}>لینک جایگزین پرداخت</Button>}
      </div>
    </Card>
    {extra?.gateway === "tonpays" && extra.paymentId ? <TonPaysAction paymentId={extra.paymentId} /> : null}
    </>
  )
}

/** Discount code field with apply button. */
export function DiscountField({ value, onChange, onApply, loading, summary }: { value: string; onChange: (v: string) => void; onApply: () => void; loading?: boolean; summary?: string | null }) {
  return (
    <Card>
      <div className="x-stack" style={{ gap: 8 }}>
        <div className="x-row-flex" style={{ alignItems: "flex-end" }}>
          <div className="x-grow"><Input label="کد تخفیف (اختیاری)" ltr placeholder="CODE" value={value} onChange={(e) => onChange(e.target.value)} /></div>
          <Button icon={<Tag size={15} />} loading={loading} onClick={onApply}>اعمال</Button>
        </div>
        {summary && <div className="x-chip ok" style={{ alignSelf: "flex-start" }}><Check size={13} />{summary}</div>}
      </div>
    </Card>
  )
}

export { WalletIcon }
