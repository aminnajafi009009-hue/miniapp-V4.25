import { useState } from "react"
import { toast } from "sonner"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import UniquePaySection from "./UniquePaySection"
import { Alert, Button, Card, Chip, Input, PageSkeleton, PageTop, Section, Segmented, Switch } from "@/shared/ui/kit"

const TOPUP_LABELS: Record<string, string> = { card: "کارت‌به‌کارت", online: "یونیک‌پی", crypto: "ارز دیجیتال", frenzyex: "FrenzyEx", tronado: "ترونادو", tonpays: "تون‌پیز" }
const PM_LABELS: Record<string, string> = { auto: "خودکار", standard: "کارت‌به‌کارت", nowpay: "کریپتو" }

export default function AdminGateways() {
  const { data, error, setData } = useLoad<any>(() => adminGet("/gateways"))
  const naming = useLoad<any>(() => adminGet("/naming"))
  const [busy, setBusy] = useState("")
  const [edit, setEdit] = useState<Record<string, string>>({})
  const [prefix, setPrefix] = useState<string | null>(null)

  const act = async (gateway: string, action: string, extra: any = {}, okMsg = "انجام شد") => {
    setBusy(gateway + action + (extra.field || ""))
    try {
      const r = await adminPost("/gateways", { gateway, action, ...extra })
      setData(r)
      if (r.message) toast(r.message); else toast.success(okMsg)
      return true
    } catch (e) { toast.error(friendlyErrorMessage(e, "عملیات ناموفق بود")); return false } finally { setBusy("") }
  }
  const save = async (gw: string, field: string) => {
    const k = gw + field
    if (await act(gw, "set", { field, value: edit[k] }, "ذخیره شد")) setEdit((p) => { const n = { ...p }; delete n[k]; return n })
  }
  const saveNaming = async (body: any) => {
    try { const r = await adminPost("/naming", body); naming.setData(r); setPrefix(null); toast.success("ذخیره شد") }
    catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) }
  }

  if (error) return <div className="x-page"><PageTop title="درگاه‌ها و نام‌گذاری" back="/admin/more" /><Alert tone="bad">دریافت ناموفق بود</Alert></div>
  if (!data || !naming.data) return <div className="x-page"><PageTop title="درگاه‌ها و نام‌گذاری" back="/admin/more" /><PageSkeleton /></div>

  const fld = (gw: string, field: string, label: string, opts: { secret?: boolean; ltr?: boolean; type?: string } = {}) => {
    const k = gw + field
    const cur = data[gw][field]
    return (
      <div key={k} className="x-row-flex" style={{ alignItems: "flex-end" }}>
        <div className="x-grow">
          <Input label={label} ltr={opts.ltr ?? true} type={opts.type} placeholder={opts.secret ? (cur || "تنظیم نشده") : undefined}
            value={edit[k] ?? (opts.secret ? "" : String(cur ?? ""))} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
        </div>
        {edit[k] !== undefined && <Button variant="primary" loading={busy === gw + "set" + field} onClick={() => save(gw, field)}>ذخیره</Button>}
      </div>
    )
  }
  const f = data.frenzyex, t = data.tronado, tp = data.tonpays

  return (
    <div className="x-page">
      <PageTop title="درگاه‌ها و نام‌گذاری" back="/admin/more" />

      <Section title="نام‌گذاری سرویس‌ها"><Card><div className="x-stack">
        <Segmented<string> value={naming.data.mode} options={[{ value: "default", label: "پیشوند + ۸ رقم" }, { value: "user", label: "انتخاب توسط کاربر" }]} onChange={(v) => saveNaming({ mode: v })} />
        <div className="x-muted">در حالت «انتخاب توسط کاربر» هنگام خرید پلن VIP (غیر نماینده/تست) نام پرسیده می‌شود و نام نهایی base_12345 است؛ در حالت پیش‌فرض نام = پیشوند + ۸ رقم.</div>
        <div className="x-row-flex" style={{ alignItems: "flex-end" }}>
          <div className="x-grow"><Input label="پیشوند نام کانفیگ" ltr value={prefix ?? naming.data.prefix} onChange={(e) => setPrefix(e.target.value)} /></div>
          {prefix !== null && <Button variant="primary" onClick={() => saveNaming({ prefix })}>ذخیره</Button>}
        </div>
      </div></Card></Section>

      <UniquePaySection />

      <Section title="FrenzyEx"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال</span><Switch checked={f.enabled} onChange={() => act("frenzyex", "toggle")} /></div>
        {fld("frenzyex", "api_key", "API Key", { secret: true })}
        {fld("frenzyex", "callback_secret", "Callback Secret", { secret: true })}
        {fld("frenzyex", "base_url", "Base URL")}
        {fld("frenzyex", "public_url", "آدرس عمومی HTTPS ربات")}
        {fld("frenzyex", "min_amount", "حداقل مبلغ (تومان)", { type: "number" })}
        {fld("frenzyex", "usd_rate_toman", "نرخ USD به تومان (۰ = ارسال نشود)", { type: "number" })}
        {fld("frenzyex", "description", "توضیح فاکتور", { ltr: false })}
        <div className="x-row-flex"><span className="x-grow">روش پرداخت مشتری</span><Button loading={busy === "frenzyexcycle_method"} onClick={() => act("frenzyex", "cycle_method")}>{PM_LABELS[f.payment_method] || f.payment_method}</Button></div>
        <div className="x-row-flex"><span className="x-grow">لینک اصلی</span><Button loading={busy === "frenzyexcycle_link"} onClick={() => act("frenzyex", "cycle_link")}>{f.link_mode === "checkout" ? "checkout" : "داخل چت ربات"}</Button></div>
        <div className="x-muted" style={{ direction: "ltr", wordBreak: "break-all" }}>Callback: {f.callback_url || "❌ آدرس عمومی مشخص نیست"}</div>
        <Button loading={busy === "frenzyextest"} onClick={() => act("frenzyex", "test")}>تست اتصال</Button>
      </div></Card></Section>

      <Section title="ترونادو (Tronado)"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال</span><Switch checked={t.enabled} onChange={() => act("tronado", "toggle")} /></div>
        {fld("tronado", "api_key", "API Key", { secret: true })}
        {fld("tronado", "ipn_signing_key", "کلید امضای IPN", { secret: true })}
        {fld("tronado", "wallet_address", "آدرس کیف پول ترون (TRC20)")}
        {t.wallet_address && t.wallet_valid === false && <Chip tone="warn">آدرس کیف پول نامعتبر است</Chip>}
        {fld("tronado", "wage_percent", "سهم کارمزد روی فروشنده (۰ تا ۱۰۰)", { type: "number" })}
        {fld("tronado", "min_amount", "حداقل مبلغ (تومان)", { type: "number" })}
        {fld("tronado", "base_url", "Base URL")}
        {fld("tronado", "public_url", "آدرس عمومی HTTPS ربات")}
        <div className="x-muted" style={{ direction: "ltr", wordBreak: "break-all" }}>IPN: {t.ipn_url || "❌ آدرس عمومی مشخص نیست"}</div>
        <div className="x-muted">دامنه‌ی Callback باید قبلاً توسط پشتیبانی ترونادو ثبت شود. کیف پول را با بخش «ارز دیجیتال» یکی نکنید.</div>
        <Button loading={busy === "tronadotest"} onClick={() => act("tronado", "test")}>تست اتصال</Button>
      </div></Card></Section>

      <Section title="تون‌پیز (TonPays)"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال</span><Switch checked={tp.enabled} onChange={() => act("tonpays", "toggle")} /></div>
        {fld("tonpays", "api_key", "API Key (کلید استاندارد)", { secret: true })}
        {fld("tonpays", "webhook_secret", "سکرت امضای وب‌هوک (اختیاری)", { secret: true })}
        {fld("tonpays", "base_url", "Base URL")}
        {fld("tonpays", "public_url", "آدرس عمومی HTTPS ربات")}
        {fld("tonpays", "min_amount", "حداقل مبلغ (تومان)", { type: "number" })}
        <div className="x-row-flex"><span className="x-grow">لینک اصلی</span><Button loading={busy === "tonpayscycle_link"} onClick={() => act("tonpays", "cycle_link")}>{tp.link_mode === "web" ? "صفحه‌ی وب" : "ربات تلگرام"}</Button></div>
        <div className="x-row-flex"><span className="x-grow">ارسال شناسه‌ی تلگرام خریدار</span><Switch checked={!!tp.send_buyer} onChange={() => act("tonpays", "toggle_buyer")} /></div>
        <div className="x-muted" style={{ direction: "ltr", wordBreak: "break-all" }}>Webhook: {tp.callback_url || "❌ آدرس عمومی مشخص نیست"}</div>
        <div className="x-muted">سکرت امضا از پروفایل ← کلید API ساخته می‌شود؛ بدون آن، وب‌هوک‌ها با استعلام مستقیم از API تأیید می‌شوند. مستندات: doc.tonpays.online</div>
        <Button loading={busy === "tonpaystest"} onClick={() => act("tonpays", "test")}>تست اتصال</Button>
      </div></Card></Section>

      <Section title="روش‌های شارژ کیف پول"><Card><div className="x-stack">
        {Object.entries(data.topup).map(([m, on]) => (
          <div key={m} className="x-row-flex"><span className="x-grow">{TOPUP_LABELS[m] || m}</span><Switch checked={!!on} onChange={() => act("", "topup", { method: m })} /></div>
        ))}
      </div></Card></Section>
    </div>
  )
}
