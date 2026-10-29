import { useState } from "react"
import { toast } from "sonner"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Card, Chip, Empty, Input, PageSkeleton, PageTop, Row, Section, Segmented, Switch, List } from "@/shared/ui/kit"
import { faDigits } from "@/shared/lib/format"

interface State { enabled: boolean; free_gb: number; daily_mb: number; started: number; blocked: number; items: { id: number; name: string; blocked: boolean }[] }

export default function AdminFup() {
  const { data, error, setData } = useLoad<State>(() => adminGet("/fup"))
  const [free, setFree] = useState<string | null>(null)
  const [daily, setDaily] = useState<string | null>(null)
  const [unit, setUnit] = useState<"gb" | "mb">("gb")
  const [busy, setBusy] = useState(false)
  const call = async (path: string, body: Record<string, unknown>, ok = "ذخیره شد") => {
    setBusy(true)
    try { setData(await adminPost(path, body)); toast.success(ok); return true }
    catch (e) { toast.error(friendlyErrorMessage(e, "انجام نشد")); return false } finally { setBusy(false) }
  }
  if (error) return <div className="x-page"><PageTop title="مصرف منصفانه" back="/admin/more" /><Alert tone="bad">دریافت ناموفق بود</Alert></div>
  if (!data) return <div className="x-page"><PageTop title="مصرف منصفانه" back="/admin/more" /><PageSkeleton /></div>
  const dailyShown = daily ?? String(unit === "gb" ? +(data.daily_mb / 1024).toFixed(3) : data.daily_mb)
  return (
    <div className="x-page">
      <PageTop title="مصرف منصفانه" sub="برای سرویس‌های نامحدود پنل (به‌جز PAYG)" back="/admin/more" />
      <Alert tone="warn">تا «حد مصرف آزاد» محدودیتی نیست؛ بعد از آن هر روز فقط سهمیه‌ی روزانه مجاز است و با رسیدن به سقف، سرویس تا ساعت ۰۰:۰۰ متوقف می‌شود و کاربر نمی‌تواند فعالش کند.</Alert>
      <Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال</span><Switch checked={data.enabled} onChange={(v) => call("/fup", { enabled: v })} /></div>
        <Input label="حد مصرف آزاد (گیگابایت)" type="number" value={free ?? String(data.free_gb)} onChange={(e) => setFree(e.target.value)} />
        {free !== null && <Button variant="primary" loading={busy} onClick={async () => { if (await call("/fup", { free_gb: Number(free) })) setFree(null) }}>ذخیره‌ی حد آزاد</Button>}
        <Segmented<"gb" | "mb"> value={unit} options={[{ value: "gb", label: "گیگابایت" }, { value: "mb", label: "مگابایت" }]} onChange={(u) => { setUnit(u); setDaily(null) }} />
        <Input label={`سهمیه‌ی روزانه (${unit === "gb" ? "گیگابایت" : "مگابایت"})`} type="number" value={dailyShown} onChange={(e) => setDaily(e.target.value)} />
        {daily !== null && <Button variant="primary" loading={busy} onClick={async () => { if (await call("/fup", { daily_mb: Number(daily) * (unit === "gb" ? 1024 : 1) })) setDaily(null) }}>ذخیره‌ی سهمیه‌ی روزانه</Button>}
        <div className="x-muted">در مصرف منصفانه: {faDigits(data.started)} · متوقف‌شده: {faDigits(data.blocked)}</div>
      </div></Card>
      <Section title="سرویس‌های متوقف‌شده">
        {data.items.length === 0 ? <Empty title="سرویسی متوقف نیست" /> : <List>{data.items.map((s) => (
          <Row key={s.id} chevron={false} title={<span dir="ltr">{s.name}</span>} right={<span className="x-row-flex"><Chip tone="bad">متوقف</Chip>
            <Button size="sm" onClick={() => call(`/fup/${s.id}/release`, {}, "آزاد شد")}>آزادسازی</Button></span>} />
        ))}</List>}
      </Section>
    </div>
  )
}
