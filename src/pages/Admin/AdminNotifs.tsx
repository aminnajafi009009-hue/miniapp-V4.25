import { toast } from "sonner"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Card, PageSkeleton, PageTop, Section } from "@/shared/ui/kit"

interface Item { key: string; label: string; audience: "user" | "admin"; enabled: boolean }

export default function AdminNotifs() {
  const { data, error, setData } = useLoad<{ items: Item[] }>(() => adminGet("/notifs"))
  const set = async (key: string, enabled: boolean) => {
    try { setData(await adminPost("/notifs", { key, enabled })) } catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) }
  }
  if (error) return <div className="x-page"><PageTop title="تنظیمات اعلان‌ها" back="/admin/more" /><Alert tone="bad">دریافت ناموفق بود</Alert></div>
  if (!data) return <div className="x-page"><PageTop title="تنظیمات اعلان‌ها" back="/admin/more" /><PageSkeleton /></div>
  const group = (aud: "user" | "admin", title: string) => (
    <Section title={title}><Card><div className="x-stack">
      {data.items.filter((i) => i.audience === aud).map((i) => (
        <div key={i.key} className="x-row-flex">
          <span className="x-grow">{i.label}</span>
          <button type="button" aria-label="روشن" onClick={() => set(i.key, true)}
            style={{ width: 38, height: 34, borderRadius: 10, border: "1px solid var(--line, #8883)", background: i.enabled ? "var(--ok, #22a55b)" : "transparent", color: i.enabled ? "#fff" : "inherit" }}>✓</button>
          <button type="button" aria-label="خاموش" onClick={() => set(i.key, false)}
            style={{ width: 38, height: 34, borderRadius: 10, border: "1px solid var(--line, #8883)", background: !i.enabled ? "var(--bad, #e5484d)" : "transparent", color: !i.enabled ? "#fff" : "inherit" }}>✕</button>
        </div>
      ))}
    </div></Card></Section>
  )
  return (
    <div className="x-page">
      <PageTop title="تنظیمات اعلان‌ها" back="/admin/more" />
      <div className="x-muted">✓ = روشن، ✕ = خاموش. همه به‌طور پیش‌فرض روشن‌اند.</div>
      {group("user", "پیام‌های کاربران")}
      {group("admin", "🛡 اعلان‌ها و لاگ‌های ادمین")}
    </div>
  )
}
