import { toast } from "sonner"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Card, PageSkeleton, PageTop, Section } from "@/shared/ui/kit"

interface Topic { key: string; title: string; desc: string; created: boolean; enabled: boolean }
interface State { configured: boolean; chat_id: number | null; enabled: boolean; topics: Topic[] }

const btn = (on: boolean, color: string) => ({
  width: 38, height: 34, borderRadius: 10, border: "1px solid var(--line, #8883)",
  background: on ? color : "transparent", color: on ? "#fff" : "inherit",
})

export default function AdminReports() {
  const { data, error, setData } = useLoad<State>(() => adminGet("/adv"))
  const act = async (body: Record<string, unknown>, ok?: string) => {
    try { setData(await adminPost("/adv", body)); if (ok) toast.success(ok) } catch (e) { toast.error(friendlyErrorMessage(e, "انجام نشد")) }
  }
  if (error) return <div className="x-page"><PageTop title="گزارشات پیشرفته" back="/admin/more" /><Alert tone="bad">دریافت ناموفق بود</Alert></div>
  if (!data) return <div className="x-page"><PageTop title="گزارشات پیشرفته" back="/admin/more" /><PageSkeleton /></div>
  return (
    <div className="x-page">
      <PageTop title="گزارشات پیشرفته" back="/admin/more" />
      {!data.configured ? (
        <Alert tone="warn">گروهی ثبت نشده است. راه‌اندازی (ساخت گروه، روشن‌کردن Topics، ادمین‌کردن ربات و ارسال آیدی عددی گروه) از داخل ربات انجام می‌شود: «اطلاعات ربات ← 📊 گزارشات پیشرفته».</Alert>
      ) : (
        <Section title={`گروه ${data.chat_id}`}><Card><div className="x-stack">
          <div className="x-row-flex">
            <span className="x-grow">کل گزارشات</span>
            <button type="button" aria-label="روشن" onClick={() => act({ action: "toggle_all", enabled: true })} style={btn(data.enabled, "var(--ok, #22a55b)")}>✓</button>
            <button type="button" aria-label="خاموش" onClick={() => act({ action: "toggle_all", enabled: false })} style={btn(!data.enabled, "var(--bad, #e5484d)")}>✕</button>
          </div>
          <button type="button" className="x-btn" onClick={() => act({ action: "backup" }, "بک‌آپ در حال ارسال است")}>💾 بک‌آپ همین حالا</button>
        </div></Card></Section>
      )}
      <Section title="تاپیک‌ها"><Card><div className="x-stack">
        {data.topics.map((t) => (
          <div key={t.key} className="x-row-flex">
            <span className="x-grow">{t.title}{!t.created && data.configured ? " (ساخته نشده)" : ""}<div className="x-muted" style={{ fontSize: 12 }}>{t.desc}</div></span>
            <button type="button" aria-label="روشن" onClick={() => act({ action: "toggle_topic", key: t.key, enabled: true })} style={btn(t.enabled, "var(--ok, #22a55b)")}>✓</button>
            <button type="button" aria-label="خاموش" onClick={() => act({ action: "toggle_topic", key: t.key, enabled: false })} style={btn(!t.enabled, "var(--bad, #e5484d)")}>✕</button>
          </div>
        ))}
      </div></Card></Section>
    </div>
  )
}
