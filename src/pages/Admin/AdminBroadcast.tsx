import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Megaphone, Square } from "lucide-react"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { ask } from "@/shared/lib/confirm"
import { Alert, Bar, Button, Card, Chip, PageSkeleton, PageTop, Section, Textarea } from "@/shared/ui/kit"
import { faDigits } from "@/shared/lib/format"

export default function AdminBroadcast() {
  const { data, error } = useLoad<any>(() => adminGet("/broadcast/audiences"))
  const [aud, setAud] = useState("all")
  const [text, setText] = useState("")
  const [job, setJob] = useState<string | null>(null)
  const [st, setSt] = useState<any>(null)
  const timer = useRef<any>(null)
  useEffect(() => {
    if (!job) return
    const tick = async () => { try { const r = await adminGet(`/broadcast/${job}`); setSt(r); if (r.done) { clearInterval(timer.current); toast.success("ارسال همگانی تمام شد") } } catch { /* ignore */ } }
    void tick(); timer.current = setInterval(tick, 2000)
    return () => clearInterval(timer.current)
  }, [job])
  const cur = data?.items?.find((a: any) => a.key === aud)
  const send = async () => {
    if (!(await ask(`پیام برای ${faDigits(cur?.count ?? 0)} نفر ارسال شود؟`))) return
    try { const r = await adminPost("/broadcast", { text, audience: aud }); setJob(r.job); setSt({ total: r.total, sent: 0, failed: 0, done: false }) }
    catch (e) { toast.error(friendlyErrorMessage(e, "ارسال ناموفق بود")) }
  }
  const sendRich = async () => {
    try {
      await adminPost("/broadcast/rich", { audience: aud })
      toast.success("پیام در چت ربات برایتان ارسال شد؛ همان‌جا ادامه دهید")
      setTimeout(() => { try { (window as any).Telegram?.WebApp?.close?.() } catch { /* ignore */ } }, 900)
    } catch (e) { toast.error(friendlyErrorMessage(e, "انجام نشد")) }
  }
  const running = !!st && !st.done
  return (
    <div className="x-page">
      <PageTop title="پیام همگانی" back="/admin/more" />
      {st && <Card hero><div className="x-stack">
        <div className="x-between"><b>{st.done ? "ارسال کامل شد" : "در حال ارسال…"}</b><span className="x-muted">{faDigits(st.sent + st.failed)} / {faDigits(st.total)}</span></div>
        <Bar value={st.total ? ((st.sent + st.failed) / st.total) * 100 : 100} />
        <div className="x-row-flex"><Chip tone="ok">موفق {faDigits(st.sent)}</Chip><Chip tone="bad">ناموفق {faDigits(st.failed)}</Chip>
          {running && <Button size="sm" variant="danger" icon={<Square size={13} />} onClick={() => adminPost(`/broadcast/${job}/stop`)}>توقف</Button>}</div>
      </div></Card>}
      <Section title="گروه مخاطب">
        {error ? <Alert tone="bad">دریافت ناموفق بود</Alert> : !data ? <PageSkeleton /> : (
          <div className="x-row-flex" style={{ flexWrap: "wrap" }}>{data.items.map((a: any) => <Chip key={a.key} on={a.key === aud} onClick={() => setAud(a.key)}>{a.label} · {faDigits(a.count)}</Chip>)}</div>
        )}
      </Section>
      <Textarea label="متن پیام" rows={7} maxLength={3500} value={text} onChange={(e) => setText(e.target.value)} placeholder="متن پیام…" hint="متن ساده؛ تگ‌های HTML تلگرام (b، i، a، tg-emoji) پشتیبانی می‌شود. کاربرانی که اعلان تبلیغاتی را خاموش کرده‌اند دریافت نمی‌کنند." />
      <Button variant="primary" size="lg" full icon={<Megaphone size={17} />} disabled={!text.trim() || running || !cur?.count} onClick={send}>ارسال</Button>
      <Section title="پیام ریچ (ایموجی پرمیوم، رسانه، دکمه)">
        <Alert tone="warn">برای حفظ ایموجی پرمیوم و قالب اصلی پیام (عکس، فیلم، دکمه‌ها)، پیام را در چت ربات بفرستید؛ دقیقاً مثل ارسال همگانی داخل ربات.</Alert>
        <Button full disabled={running || !cur?.count} onClick={sendRich}>ارسال پیام ریچ از داخل ربات</Button>
      </Section>
    </div>
  )
}
