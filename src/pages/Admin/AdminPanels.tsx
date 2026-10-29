import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { ask } from "@/shared/lib/confirm"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Card, Chip, Empty, Input, KV, PageSkeleton, PageTop, Segmented, Sheet, Switch } from "@/shared/ui/kit"
import { faDigits, timeAgo } from "@/shared/lib/format"

export default function AdminPanels() {
  const { data, error, reload } = useLoad<any>(() => adminGet("/panels"))
  const types = ["marzban", "pasargad", "threexui", "shahrah"]
  const [f, setF] = useState<any>(null)
  const [busy, setBusy] = useState("")
  const saveP = async () => {
    setBusy("save")
    try { await adminPost("/panels/manage", f); toast.success("ذخیره شد"); setF(null); await reload() }
    catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) } finally { setBusy("") }
  }
  const testP = async () => {
    setBusy("test")
    try { const r = await adminPost(`/panels/manage/${f.id}/test`); r.connected ? toast.success(r.message) : toast.error(r.message) }
    catch (e) { toast.error(friendlyErrorMessage(e, "تست ناموفق بود")) } finally { setBusy("") }
  }
  const delP = async () => { if (await ask("پنل حذف شود؟ (نگاشت‌های آن از بین می‌رود)")) { try { await adminPost(`/panels/manage/${f.id}/delete`); toast.success("حذف شد"); setF(null); await reload() } catch (e) { toast.error(friendlyErrorMessage(e, "ناموفق بود")) } } }
  const edit = async (id: number) => { try { const r = await adminGet("/panels/manage"); const p = r.items.find((x: any) => x.id === id); if (p) setF({ id: p.id, type: p.type, name: p.name, base_url: p.base_url, username: p.username, password: "", api_key: "", has_password: p.has_password, has_api_key: p.has_api_key }) } catch { toast.error("دریافت ناموفق بود") } }
  const toggle = async (id: number) => { try { await adminPost(`/panels/${id}/toggle`); await reload() } catch (e) { toast.error(friendlyErrorMessage(e, "ناموفق بود")) } }
  return (
    <div className="x-page">
      <PageTop title="پنل‌های VPN" back="/admin/more" />
      <Button variant="primary" icon={<Plus size={16} />} full onClick={() => setF({ type: "marzban", name: "", base_url: "", username: "", password: "", api_key: "" })}>افزودن پنل</Button>
      {error ? <Alert tone="bad">دریافت ناموفق بود</Alert> : !data ? <PageSkeleton /> : data.items.length === 0 ? <Empty title="پنلی ثبت نشده" /> : data.items.map((p: any) => {
        const bad = p.health.circuit_open
        return (
          <Card key={p.id}>
            <div className="x-stack" style={{ gap: 8 }}>
              <div className="x-row-flex"><div className="x-grow" onClick={() => edit(p.id)} style={{ cursor: "pointer" }}><div className="x-h3">{p.name} ✎</div><div className="x-muted" dir="ltr" style={{ textAlign: "right" }}>{p.host}</div></div>
                <Chip tone={bad ? "bad" : p.enabled ? "ok" : undefined}>{bad ? "قطع" : p.enabled ? "فعال" : "غیرفعال"}</Chip><Switch checked={p.enabled} onChange={() => toggle(p.id)} /></div>
              <KV k="نوع" v={p.type} />
              <KV k="سرویس‌ها" v={faDigits(p.services)} />
              {p.health.latency_ms != null && <KV k="تأخیر" v={`${faDigits(Math.round(p.health.latency_ms))} ms`} />}
              {p.health.last_ok_at && <KV k="آخرین پاسخ موفق" v={timeAgo(Math.round(p.health.last_ok_at))} />}
              {p.health.last_error && <div className="x-muted" style={{ color: "var(--bad)" }}>{p.health.last_error}</div>}
            </div>
          </Card>
        )
      })}
      <Sheet open={!!f} onClose={() => setF(null)} title={f?.id ? "ویرایش پنل" : "پنل جدید"} footer={f && <>
        <Button variant="primary" size="lg" full loading={busy === "save"} onClick={saveP}>ذخیره</Button>
        {f.id && <Button full loading={busy === "test"} onClick={testP}>تست اتصال</Button>}
        {f.id && <Button variant="danger" full onClick={delP}>حذف پنل</Button>}</>}>
        {f && <>
          {!f.id && <Segmented<string> value={f.type} options={types.map((t) => ({ value: t, label: t }))} onChange={(v) => setF({ ...f, type: v })} />}
          <Input label="نام پنل" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input label="آدرس پنل (https://…)" ltr value={f.base_url} onChange={(e) => setF({ ...f, base_url: e.target.value })} />
          <Input label="نام کاربری" ltr value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
          <Input label={f.has_password ? "رمز عبور (خالی = بدون تغییر)" : "رمز عبور"} ltr type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <Input label={f.has_api_key ? "API Key (خالی = بدون تغییر)" : "API Key (فقط شاهراه/در صورت نیاز)"} ltr value={f.api_key} onChange={(e) => setF({ ...f, api_key: e.target.value })} />
        </>}
      </Sheet>
    </div>
  )
}
