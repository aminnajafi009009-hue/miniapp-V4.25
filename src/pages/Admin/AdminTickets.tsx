import { useState } from "react"
import { toast } from "sonner"
import { Send, XCircle } from "lucide-react"
import { adminGet, adminPost, qs } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Card, Chip, Empty, PageSkeleton, PageTop, Row, Sheet, Tabs, Textarea, List } from "@/shared/ui/kit"
import { jalaliDate, faDigits } from "@/shared/lib/format"

const ST: Record<string, string> = { open: "باز", answered: "پاسخ داده‌شده", closed: "بسته" }

export default function AdminTickets() {
  const [status, setStatus] = useState("open")
  const [openId, setOpenId] = useState<number | null>(null)
  const { data, error, reload } = useLoad<any>(() => adminGet(`/tickets${qs({ status })}`), [status])
  const counts = data?.counts || {}
  return (
    <div className="x-page">
      <PageTop title="تیکت‌ها" back="/admin/more" />
      <Tabs value={status} options={Object.keys(ST).map((k) => ({ value: k, label: ST[k], count: counts[k] }))} onChange={setStatus} />
      {error ? <Empty title="خطا در دریافت" action={<Button onClick={reload}>تلاش مجدد</Button>} /> : !data ? <PageSkeleton /> : data.items.length === 0 ? <Empty title="تیکتی نیست" /> : (
        <List>{data.items.map((t: any) => <Row key={t.id} onClick={() => setOpenId(t.id)} title={`#${faDigits(t.id)} ${t.subject || "بدون عنوان"}`} sub={`${t.user_name || "—"} · ${jalaliDate(t.updated_at, true)}`} right={<Chip tone={t.status === "open" ? "warn" : t.status === "closed" ? undefined : "ok"}>{ST[t.status]}</Chip>} />)}</List>
      )}
      {openId != null && <TicketSheet id={openId} onClose={() => { setOpenId(null); void reload() }} />}
    </div>
  )
}

function TicketSheet({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, error, reload } = useLoad<any>(() => adminGet(`/tickets/${id}`), [id])
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const send = async () => {
    setBusy(true)
    try { const r = await adminPost(`/tickets/${id}/reply`, { text }); setText(""); toast[r.sent ? "success" : "warning"](r.sent ? "پاسخ ارسال شد" : "پاسخ ثبت شد ولی به کاربر نرسید"); await reload() }
    catch (e) { toast.error(friendlyErrorMessage(e, "ارسال ناموفق بود")) } finally { setBusy(false) }
  }
  const close = async () => { try { await adminPost(`/tickets/${id}/close`); toast.success("تیکت بسته شد"); onClose() } catch (e) { toast.error(friendlyErrorMessage(e, "ناموفق بود")) } }
  return (
    <Sheet open onClose={onClose} title={data ? `#${faDigits(id)} ${data.ticket.subject || ""}` : "تیکت"}
      footer={data && data.ticket.status !== "closed" ? <>
        <Button variant="primary" size="lg" full icon={<Send size={16} />} loading={busy} disabled={!text.trim()} onClick={send}>ارسال پاسخ</Button>
        <Button variant="ghost" full icon={<XCircle size={16} />} onClick={close}>بستن تیکت</Button></> : undefined}>
      {error ? <Alert tone="bad">دریافت تیکت ناموفق بود</Alert> : !data ? <PageSkeleton /> : (
        <>
          <div className="x-muted">{data.ticket.user_name} · {faDigits(data.ticket.telegram_id || "")}</div>
          <div className="x-stack" style={{ maxHeight: "40vh", overflowY: "auto" }}>
            {data.messages.map((m: any, i: number) => (
              <Card key={i} flat style={{ background: m.sender === "admin" ? "var(--accent-soft)" : undefined }}>
                <div className="x-muted">{m.sender === "admin" ? "پشتیبانی" : "کاربر"} · {jalaliDate(m.created_at, true)}</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
              </Card>
            ))}
          </div>
          {data.ticket.status !== "closed" && <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="پاسخ شما…" />}
        </>
      )}
    </Sheet>
  )
}
