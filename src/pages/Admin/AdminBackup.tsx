import { useState } from "react"
import { toast } from "sonner"
import { Download } from "lucide-react"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Card, Input, PageSkeleton, PageTop, Section, Segmented, Switch } from "@/shared/ui/kit"
import { faDigits } from "@/shared/lib/format"

interface State { enabled: boolean; days: number; last_date: string; topic_ready: boolean; time: string }

export default function AdminBackup() {
  const { data, error, setData } = useLoad<State>(() => adminGet("/backup"))
  const [busy, setBusy] = useState(false)
  const [custom, setCustom] = useState("")
  const call = async (body: Record<string, unknown>, ok?: string) => {
    setBusy(true)
    try { const r = await adminPost("/backup", body); if (body.action !== "now") setData(r as State); if (ok) toast.success(ok) }
    catch (e) { toast.error(friendlyErrorMessage(e, "انجام نشد")) } finally { setBusy(false) }
  }
  if (error) return <div className="x-page"><PageTop title="بک‌آپ" back="/admin/more" /><Alert tone="bad">دریافت ناموفق بود</Alert></div>
  if (!data) return <div className="x-page"><PageTop title="بک‌آپ" back="/admin/more" /><PageSkeleton /></div>
  const presets = [1, 2, 3, 7, 14, 30]
  return (
    <div className="x-page">
      <PageTop title="بک‌آپ" sub="دریافت فوری و بک‌آپ خودکار" back="/admin/more" />
      <Card><div className="x-stack">
        <Button variant="primary" size="lg" full icon={<Download size={17} />} loading={busy} onClick={() => call({ action: "now" }, data.topic_ready ? "بک‌آپ در ربات و تاپیک گروه ارسال شد" : "بک‌آپ در ربات ارسال شد")}>دریافت بک‌آپ</Button>
        <div className="x-muted">نسخه‌ی دیتابیس در چت ربات شما{data.topic_ready ? " و تاپیک «بک‌آپ» گروه" : ""} ارسال می‌شود.</div>
      </div></Card>
      <Section title="بک‌آپ خودکار"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">روشن</span><Switch checked={data.enabled} onChange={(v) => call({ action: "toggle", enabled: v })} /></div>
        <div className="x-muted">ساعت ۰۰:۰۰ به وقت تهران، هر {faDigits(data.days)} روز{data.last_date ? ` · آخرین: ${data.last_date}` : ""}</div>
        <Segmented<number> value={presets.includes(data.days) ? data.days : -1} options={presets.map((d) => ({ value: d, label: `${faDigits(d)}` }))} onChange={(d) => call({ action: "days", days: d })} />
        <div className="x-row-flex"><div className="x-grow"><Input label="تعداد روز دلخواه" type="number" value={custom} onChange={(e) => setCustom(e.target.value)} /></div>
          <Button disabled={!custom} loading={busy} onClick={() => call({ action: "days", days: Number(custom) }, "ذخیره شد")}>ثبت</Button></div>
      </div></Card></Section>
    </div>
  )
}
