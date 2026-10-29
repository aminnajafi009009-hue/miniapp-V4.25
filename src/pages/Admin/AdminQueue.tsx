import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Send, Trash2, UserRound } from "lucide-react"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { ask } from "@/shared/lib/confirm"
import { Alert, Button, Chip, Empty, KV, PageSkeleton, PageTop, Row, Sheet, List } from "@/shared/ui/kit"
import { faDigits, jalaliDate, num, toman } from "@/shared/lib/format"

interface QItem { kind: "order" | "custom"; id: number; telegram_id: string; user_name?: string; title: string; order_type?: string; price: number; payment_method?: string; created_at?: string; volume_gb?: number | null; days?: number | null; service_name?: string | null }
interface QData { items: QItem[]; total: number; receipts: number }

export default function AdminQueue() {
  const { data, error, reload } = useLoad<QData>(() => adminGet("/queue"))
  const nav = useNavigate()
  const [sel, setSel] = useState<QItem | null>(null)
  const [busy, setBusy] = useState("")
  const call = async (path: string, ok: string, close = true) => {
    setBusy(path)
    try { await adminPost(path, {}); toast.success(ok); if (close) setSel(null); reload(); return true }
    catch (e) { toast.error(friendlyErrorMessage(e, "انجام نشد")); return false } finally { setBusy("") }
  }
  if (error) return <div className="x-page"><PageTop title="صف درخواست‌ها" back="/admin/more" /><Alert tone="bad">دریافت ناموفق بود</Alert></div>
  if (!data) return <div className="x-page"><PageTop title="صف درخواست‌ها" back="/admin/more" /><PageSkeleton /></div>
  const base = sel ? `/queue/${sel.kind}/${sel.id}` : ""
  return (
    <div className="x-page">
      <PageTop title="صف درخواست‌ها" sub={`${faDigits(data.total)} سفارش در انتظار ارسال`} back="/admin/more" />
      {data.receipts > 0 && <Alert tone="warn">{faDigits(data.receipts)} رسید در انتظار تأیید هم دارید (بخش «رسیدها»).</Alert>}
      {data.items.length === 0 ? <Empty title="سفارشی در انتظار ارسال نیست" sub="همه‌ی سفارش‌ها تحویل شده‌اند." /> : (
        <List>{data.items.map((o) => (
          <Row key={`${o.kind}${o.id}`} onClick={() => setSel(o)} title={`${o.kind === "custom" ? "🛠" : "📦"} #${faDigits(o.id)} · ${o.title}`}
            sub={`${o.user_name || "—"} · ${faDigits(o.telegram_id)} · ${jalaliDate(o.created_at, true)}`}
            right={<b className="num">{num(o.price)}</b>} />
        ))}</List>
      )}
      {data.items.length > 0 && <Button variant="danger" full icon={<Trash2 size={15} />} onClick={async () => { if (await ask("همه‌ی سفارش‌های این صف از لیست پاک شوند؟ (کانفیگی برای کاربر ارسال نمی‌شود)")) call("/queue/clear", "صف پاک شد", false) }}>پاک‌کردن همه‌ی صف</Button>}
      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? `سفارش #${faDigits(sel.id)}` : ""} footer={sel && <>
        <Button variant="primary" size="lg" full icon={<Send size={16} />} loading={busy === `${base}/panel`} onClick={() => call(`${base}/panel`, "از پنل ساخته و ارسال شد")}>ارسال از پنل</Button>
        <Button full loading={busy === `${base}/manual`} onClick={() => call(`${base}/manual`, "دکمه‌ی ارسال دستی در ربات برایتان فرستاده شد", false)}>ارسال دستی (ادامه در ربات)</Button>
        <Button full icon={<UserRound size={15} />} onClick={() => { nav(`/admin/users/${sel.telegram_id}`) }}>مدیریت کاربر</Button>
        <Button variant="danger" full icon={<Trash2 size={15} />} onClick={async () => { if (await ask("این سفارش از صف حذف شود؟")) call(`${base}/dismiss`, "از صف حذف شد") }}>حذف از صف</Button></>}>
        {sel && <>
          <KV k="کاربر" v={`${sel.user_name || "—"} (${faDigits(sel.telegram_id)})`} />
          <KV k="نوع" v={<Chip tone="info">{sel.kind === "custom" ? (sel.order_type === "renew" ? "تمدید سفارشی" : "سفارشی") : sel.order_type || "خرید"}</Chip>} />
          <KV k="پلن" v={sel.title} />
          {sel.volume_gb != null && <KV k="حجم" v={`${faDigits(sel.volume_gb)} گیگ`} />}
          {sel.days != null && <KV k="مدت" v={`${faDigits(sel.days)} روز`} />}
          {sel.service_name && <KV k="نام سرویس" v={<span dir="ltr">{sel.service_name}</span>} />}
          <KV k="مبلغ" v={toman(sel.price)} />
          <KV k="روش پرداخت" v={sel.payment_method || "—"} />
        </>}
      </Sheet>
    </div>
  )
}
