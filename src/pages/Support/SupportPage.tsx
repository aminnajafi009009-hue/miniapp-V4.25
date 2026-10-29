import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Megaphone, Send, Headphones, BookOpen } from "lucide-react"
import WebApp from "@twa-dev/sdk"
import { Button, Card, List, PageTop, Row, Section, Textarea, Tile } from "@/shared/ui/kit"
import { getSupportInfo, sendTicket } from "@/shared/api/services"

const open = (url: string) => { try { if (/^https:\/\/t\.me\//.test(url)) WebApp.openTelegramLink(url); else WebApp.openLink(url) } catch { window.open(url, "_blank") } }

export default function SupportPage() {
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [openGuide, setOpenGuide] = useState<number | null>(null)
  const [info, setInfo] = useState<{ channel_url: string; guide_url?: string; guides?: { id: number; title: string; body: string }[] }>({ channel_url: "https://t.me/businesss_support" })
  useEffect(() => { getSupportInfo().then((r) => setInfo((p) => ({ ...p, ...r }))).catch(() => undefined) }, [])

  const submit = async () => {
    if (!text.trim()) return
    setBusy(true)
    try { await sendTicket(text.trim()); toast.success("پیام شما برای پشتیبانی ارسال شد"); setText("") }
    catch { toast.error("ارسال تیکت ناموفق بود") } finally { setBusy(false) }
  }
  return (
    <div className="x-page">
      <PageTop title="پشتیبانی" sub="تیکت بزنید یا از کانال‌ها کمک بگیرید" back="/profile" />
      <Card hero>
        <div className="x-row-flex" style={{ gap: 12 }}>
          <Tile icon={<Headphones size={22} />} size="lg" solid />
          <div className="x-grow"><div className="x-h2">ما کنارتان هستیم</div><div className="x-sub">پاسخ تیکت‌ها داخل همین ربات برای شما ارسال می‌شود.</div></div>
        </div>
      </Card>
      <Section title="ارسال تیکت">
        <Card>
          <div className="x-stack">
            <Textarea placeholder="پیام خود را برای پشتیبانی بنویسید…" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
            <Button variant="primary" size="lg" full icon={<Send size={17} />} disabled={!text.trim()} loading={busy} onClick={submit}>ارسال تیکت</Button>
          </div>
        </Card>
      </Section>
      {info.guides && info.guides.length > 0 && (
        <Section title="راهنماها و آموزش‌ها">
          {info.guides.map((g) => (
            <Card key={g.id} tap onClick={() => setOpenGuide(openGuide === g.id ? null : g.id)}>
              <div className="x-h3">{g.title}</div>
              {openGuide === g.id && <div className="x-sub" style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{g.body}</div>}
            </Card>
          ))}
        </Section>
      )}
      <Section title="راه‌های ارتباطی">
        <List>
          <Row icon={<Megaphone size={19} />} tone="blue" title="کانال اصلی و پشتیبان" sub="اطلاعیه‌ها و پاسخ سریع" onClick={() => open(info.channel_url)} />
          {info.guide_url && <Row icon={<BookOpen size={19} />} tone="green" title="راهنمای اتصال" sub="آموزش نصب و استفاده" onClick={() => open(info.guide_url!)} />}
        </List>
      </Section>
    </div>
  )
}
