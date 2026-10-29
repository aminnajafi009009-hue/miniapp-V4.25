import { useState } from "react"
import { toast } from "sonner"
import { Plus, Shield, Trash2 } from "lucide-react"
import { adminGet, adminPost, useAdminStore } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { ask } from "@/shared/lib/confirm"
import { Alert, Button, Chip, Empty, Input, PageSkeleton, PageTop, Row, Segmented, Sheet, Switch, List } from "@/shared/ui/kit"
import { faDigits, toman } from "@/shared/lib/format"

const SECTION_LABEL: Record<string, string> = { stats: "آمار", requests: "سفارش‌ها", receipts: "رسیدها", users: "کاربران", broadcast: "پیام همگانی", discounts: "تخفیف", agency: "نمایندگی", plans: "پلن‌ها", vpn_panel: "پنل‌ها", referrals: "دعوت‌ها", botinfo: "اطلاعات و پرداخت", orders_toggle: "قفل سفارش", settings: "تنظیمات", logs: "لاگ", health: "سلامت", tickets: "تیکت‌ها" }

export default function AdminAgents() {
  const isMain = useAdminStore((s) => s.me?.is_main)
  const [tab, setTab] = useState<"agents" | "team">("agents")
  return (
    <div className="x-page">
      <PageTop title="نمایندگان و تیم" back="/admin/more" />
      {isMain && <Segmented<"agents" | "team"> value={tab} options={[{ value: "agents", label: "نمایندگان" }, { value: "team", label: "تیم ادمین" }]} onChange={setTab} />}
      {tab === "agents" ? <Agents /> : <Team />}
    </div>
  )
}

function Agents() {
  const { data, error, reload } = useLoad<any>(() => adminGet("/agents"))
  const [f, setF] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [ex, setEx] = useState<any>(null)
  const openEx = async () => { try { setEx(await adminGet(`/agents/${f.telegram_id}/extras`)) } catch (e) { toast.error(friendlyErrorMessage(e, "دریافت ناموفق بود")) } }
  const saveEx = async (body: any) => { try { setEx(await adminPost(`/agents/${f.telegram_id}/extras`, body)); toast.success("ذخیره شد") } catch (e) { toast.error(friendlyErrorMessage(e, "ناموفق بود")) } }
  const save = async () => {
    setBusy(true)
    try { const r = await adminPost("/agents", { telegram_id: f.telegram_id, percent: Number(f.percent), prefix: f.prefix, note: f.note, categories: f.categories }); toast.success(r.warning || "ذخیره شد"); setF(null); await reload() }
    catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) } finally { setBusy(false) }
  }
  const del = async () => { if (await ask("این نماینده حذف شود؟")) { try { await adminPost(`/agents/${f.telegram_id}/delete`); toast.success("حذف شد"); setF(null); await reload() } catch (e) { toast.error(friendlyErrorMessage(e, "ناموفق بود")) } } }
  const toggleCat = (id: number) => setF({ ...f, categories: f.categories.includes(id) ? f.categories.filter((x: number) => x !== id) : [...f.categories, id] })
  return (
    <>
      <Button variant="primary" icon={<Plus size={16} />} full onClick={() => setF({ telegram_id: "", percent: "30", prefix: "", note: "", categories: [], isNew: true })}>نماینده‌ی جدید</Button>
      {error ? <Alert tone="bad">دریافت ناموفق بود</Alert> : !data ? <PageSkeleton /> : data.items.length === 0 ? <Empty title="نماینده‌ای ندارید" /> : (
        <List>{data.items.map((a: any) => <Row key={a.telegram_id} onClick={() => setF({ ...a, percent: String(a.percent), isNew: false })} title={a.name || faDigits(a.telegram_id)} sub={`${faDigits(a.telegram_id)} · خرید ${toman(a.total_purchase)}${a.prefix ? " · پیشوند " + a.prefix : ""}`} right={<Chip tone="info">{faDigits(a.percent)}٪</Chip>} />)}</List>
      )}
      <Sheet open={!!f} onClose={() => setF(null)} title={f?.isNew ? "نماینده‌ی جدید" : "ویرایش نماینده"} footer={f && <><Button variant="primary" size="lg" full loading={busy} onClick={save}>ذخیره</Button>{!f.isNew && <Button full onClick={openEx}>تخفیف گزینه‌ها و سهمیه‌ی تست</Button>}{!f.isNew && <Button variant="danger" full icon={<Trash2 size={15} />} onClick={del}>حذف نماینده</Button>}</>}>
        {f && <>
          <Input label="آیدی عددی تلگرام" ltr inputMode="numeric" disabled={!f.isNew} value={f.telegram_id} onChange={(e) => setF({ ...f, telegram_id: e.target.value })} />
          <Input label="درصد تخفیف (۱ تا ۱۰۰)" type="number" value={f.percent} onChange={(e) => setF({ ...f, percent: e.target.value })} />
          <Input label="پیشوند نام کانفیگ (اختیاری)" ltr value={f.prefix} onChange={(e) => setF({ ...f, prefix: e.target.value })} />
          <Input label="یادداشت" value={f.note || ""} onChange={(e) => setF({ ...f, note: e.target.value })} />
          {data?.categories?.length > 0 && <div className="x-stack" style={{ gap: 6 }}><div className="x-label">دسته‌های مشمول (خالی = همه)</div><div className="x-row-flex" style={{ flexWrap: "wrap" }}>{data.categories.map((c: any) => <Chip key={c.id} on={f.categories.includes(c.id)} onClick={() => toggleCat(c.id)}>{c.name}</Chip>)}</div></div>}
        </>}
      </Sheet>
      <Sheet open={!!ex} onClose={() => setEx(null)} title="سهمیه و تخفیف گزینه‌ها">
        {ex && <>
          <ExInput label="سهمیه‌ی تست ماهانه (۰ = بدون سهمیه)" value={ex.test_quota} onSave={(v) => saveEx({ test_quota: v })} />
          {ex.options.length === 0 && <div className="x-muted">گزینه‌ای برای سفارشی/PAYG تعریف نشده.</div>}
          {ex.options.map((o: any) => <ExInput key={o.kind + o.num} label={`${o.kind === "payg" ? "PAYG" : "سفارشی"} — ${o.name} (٪، خالی = پیش‌فرض: ${faDigits(o.effective)})`} value={o.override ?? ""} onSave={(v) => saveEx({ kind: o.kind, num: o.num, percent: v })} />)}
        </>}
      </Sheet>
    </>
  )
}

function ExInput({ label, value, onSave }: { label: string; value: any; onSave: (v: string) => void }) {
  const [v, setV] = useState(String(value ?? ""))
  return <div className="x-row-flex"><div className="x-grow"><Input label={label} type="number" value={v} onChange={(e) => setV(e.target.value)} /></div><Button size="sm" variant="primary" disabled={v === String(value ?? "")} onClick={() => onSave(v)}>ثبت</Button></div>
}

function Team() {
  const { data, error, reload } = useLoad<any>(() => adminGet("/team"))
  const [f, setF] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    try { await adminPost("/team", { telegram_id: f.telegram_id, name: f.name, permissions: f.permissions }); toast.success("ذخیره شد"); setF(null); await reload() }
    catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) } finally { setBusy(false) }
  }
  const del = async () => { if (await ask("این ادمین حذف شود؟")) { try { await adminPost(`/team/${f.telegram_id}/delete`); setF(null); await reload() } catch (e) { toast.error(friendlyErrorMessage(e, "ناموفق بود")) } } }
  const tog = (s: string) => setF({ ...f, permissions: f.permissions.includes(s) ? f.permissions.filter((x: string) => x !== s) : [...f.permissions, s] })
  return (
    <>
      <Button variant="primary" icon={<Plus size={16} />} full onClick={() => setF({ telegram_id: "", name: "", permissions: [], isNew: true })}>ادمین جدید</Button>
      {error ? <Alert tone="bad">دریافت ناموفق بود</Alert> : !data ? <PageSkeleton /> : data.items.length === 0 ? <Empty title="ادمین فرعی ندارید" sub="می‌توانید با دسترسی محدود، ادمین اضافه کنید." /> : (
        <List>{data.items.map((a: any) => <Row key={a.telegram_id} onClick={() => setF({ ...a, isNew: false })} icon={<Shield size={18} />} tone="violet" title={a.name || faDigits(a.telegram_id)} sub={`${faDigits(a.permissions.length)} دسترسی`} />)}</List>
      )}
      <Sheet open={!!f} onClose={() => setF(null)} title={f?.isNew ? "ادمین جدید" : "ویرایش ادمین"} footer={f && <><Button variant="primary" size="lg" full loading={busy} onClick={save}>ذخیره</Button>{!f.isNew && <Button variant="danger" full icon={<Trash2 size={15} />} onClick={del}>حذف ادمین</Button>}</>}>
        {f && <>
          <Input label="آیدی عددی تلگرام" ltr inputMode="numeric" disabled={!f.isNew} value={f.telegram_id} onChange={(e) => setF({ ...f, telegram_id: e.target.value })} />
          <Input label="نام" value={f.name || ""} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <div className="x-label">دسترسی‌ها</div>
          {(data?.sections || []).map((s: string) => <div key={s} className="x-row-flex"><span className="x-grow">{SECTION_LABEL[s] || s}</span><Switch checked={f.permissions.includes(s)} onChange={() => tog(s)} /></div>)}
        </>}
      </Sheet>
    </>
  )
}
