import { useState } from "react"
import { toast } from "sonner"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Button, Card, Input, Section, Switch } from "@/shared/ui/kit"

/** تنظیمات درگاه یونیک‌پی (قبلاً «درگاه آنلاین» در روش‌های پرداخت)؛ همان endpoint بخش online. */
export default function UniquePaySection() {
  const { data, setData } = useLoad<any>(() => adminGet("/payments"))
  const [online, setOnline] = useState<any>(null)
  const [busy, setBusy] = useState("")
  const send = async (section: string, values: any) => {
    setBusy(section)
    try { const r = await adminPost("/payments", { section, values }); setData(r); setOnline(null); toast.success("ذخیره شد") }
    catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) } finally { setBusy("") }
  }
  if (!data) return null
  const o = online ?? data.online
  return (
      <Section title="یونیک‌پی"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال</span><Switch checked={o.enabled} onChange={(v) => send("online", { enabled: v })} /></div>
        <div className="x-row-flex"><span className="x-grow">تأیید خودکار</span><Switch checked={o.auto_confirm} onChange={(v) => send("online", { auto_confirm: v })} /></div>
        <Input label="حداقل مبلغ (تومان)" type="number" value={o.min_amount} onChange={(e) => setOnline({ ...o, min_amount: e.target.value })} />
        <div className="x-row-flex"><span className="x-grow">پرداخت داخل تلگرام (خاموش = وب‌سایت درگاه)</span><Switch checked={!!o.use_telegram_link} onChange={(v) => send("online", { use_telegram_link: v })} /></div>
        <div className="x-row-flex"><span className="x-grow">نمایش کارت مقصد و مبلغ دقیق</span><Switch checked={o.show_card_white_label !== false} onChange={(v) => send("online", { show_card_white_label: v })} /></div>
        <Input label="توکن بیزینس (خالی = بدون تغییر)" ltr placeholder={o.token_hint || (o.env_token ? "از env" : "")} value={o.new_token || ""} onChange={(e) => setOnline({ ...o, new_token: e.target.value })} />
        <Input label="آدرس بازگشت (Redirect)" ltr value={o.redirect_url || ""} onChange={(e) => setOnline({ ...o, redirect_url: e.target.value })} />
        <Input label="آدرس کال‌بک (Callback)" ltr value={o.callback_url || ""} onChange={(e) => setOnline({ ...o, callback_url: e.target.value })} />
        {online && <Button variant="primary" loading={busy === "online"} onClick={() => send("online", { min_amount: online.min_amount, redirect_url: online.redirect_url, callback_url: online.callback_url, ...(online.new_token ? { business_token: online.new_token } : {}) })}>ذخیره</Button>}
      </div></Card></Section>
  )
}
