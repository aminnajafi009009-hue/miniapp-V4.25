import { useState } from "react"
import { toast } from "sonner"
import WebApp from "@twa-dev/sdk"
import { Bot, Check, X } from "lucide-react"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { ask } from "@/shared/lib/confirm"
import { Alert, Button, Card, Chip, Empty, Input, PageSkeleton, PageTop, Sheet } from "@/shared/ui/kit"
import { faDigits, jalaliDate, toman } from "@/shared/lib/format"

const KIND: Record<string, string> = { charge: "شارژ کیف پول", plan_card: "خرید پلن (کارت)", plan_crypto: "خرید پلن (ارز)", custom: "سرویس سفارشی/تمدید" }

export default function AdminReceipts() {
  const { data, error, reload } = useLoad<any>(() => adminGet("/receipts"))
  const [rej, setRej] = useState<any>(null)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState<string | number | null>(null)
  const act = async (id: string | number, kind: "approve" | "reject", body?: any) => {
    setBusy(id)
    try { const r: any = await adminPost(`/receipts/${id}/${kind}`, body); toast.success(kind === "approve" ? (r?.delivered ? "تأیید شد و سرویس تحویل داده شد" : "تأیید شد") : "رد شد"); if (kind === "approve" && r && r.delivered === false) toast.message("سرویس هنوز تحویل نشده؛ از داخل ربات (دکمه‌ی ارسال زیر پیام تأیید) تحویل دهید."); setRej(null); setReason(""); await reload() }
    catch (e) { toast.error(friendlyErrorMessage(e, "عملیات ناموفق بود")) } finally { setBusy(null) }
  }
  const openBot = () => { const u = data?.bot_username; if (u) { try { WebApp.openTelegramLink(`https://t.me/${u}`) } catch { window.open(`https://t.me/${u}`) } } }
  return (
    <div className="x-page">
      <PageTop title="رسیدهای در انتظار" sub={data ? `${faDigits(data.items.length)} مورد` : undefined} back="/admin/more" />
      {error ? <Empty title="خطا در دریافت" action={<Button onClick={reload}>تلاش مجدد</Button>} /> : !data ? <PageSkeleton /> : data.items.length === 0 ? <Empty title="رسیدی در انتظار نیست" sub="همه‌ی رسیدها بررسی شده‌اند." /> : (
        <div className="x-stack">
          <Alert>تأیید و رد رسیدها همان منطق ربات را اجرا می‌کند (ثبت خرید، اعلان به کاربر، لاگ و ساخت خودکار سرویس در صورت نگاشت پنل).</Alert>
          {data.items.map((r: any) => (
            <Card key={r.id}>
              <div className="x-stack" style={{ gap: 8 }}>
                <div className="x-row-flex"><Chip tone={r.kind === "charge" ? "info" : "warn"}>{KIND[r.kind] || r.kind}</Chip><span className="x-grow" /><b className="num">{toman(r.amount)}</b></div>
                <div className="x-muted">{r.user_name || "—"} · {faDigits(r.telegram_id)} · {jalaliDate(r.created_at, true)}</div>
                {r.label && <div className="x-sub x-ellipsis">{r.label}</div>}
                {r.can_approve ? (
                  <div className="x-row-flex">
                    <Button variant="ok" icon={<Check size={16} />} loading={busy === r.id} onClick={async () => { if (await ask(`${KIND[r.kind] || "رسید"} به مبلغ ${toman(r.amount)} تأیید شود؟`)) act(r.id, "approve") }}>تأیید</Button>
                    <Button variant="danger" icon={<X size={16} />} onClick={() => setRej(r)}>رد</Button>
                  </div>
                ) : (
                  <div className="x-row-flex">
                    <Button icon={<Bot size={16} />} onClick={openBot}>تأیید در ربات</Button>
                    <Button variant="danger" icon={<X size={16} />} onClick={() => setRej(r)}>رد</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Sheet open={!!rej} onClose={() => setRej(null)} title="رد رسید" footer={<Button variant="danger" size="lg" full loading={busy === rej?.id} onClick={() => act(rej.id, "reject", { reason })}>رد و اطلاع به کاربر</Button>}>
        <Input label="دلیل (اختیاری، برای کاربر ارسال می‌شود)" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Sheet>
    </div>
  )
}
