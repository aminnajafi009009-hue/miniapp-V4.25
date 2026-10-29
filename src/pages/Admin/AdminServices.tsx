import { useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { ask } from "@/shared/lib/confirm"
import { Alert, Button, Card, Chip, Empty, Input, PageSkeleton, PageTop, Row, Section, Segmented, Sheet, Switch, List } from "@/shared/ui/kit"
import MappingSheet from "./MappingSheet"
import { faDigits, toman } from "@/shared/lib/format"

type Kind = "payg" | "custom_build"
type Tab = Kind | "free_test"
const FIELDS: Record<Kind, [string, string][]> = {
  payg: [["price_per_gb", "قیمت هر گیگ مصرف (تومان)"]],
  custom_build: [["price_per_gb", "قیمت هر گیگ حجم"], ["price_per_30_days", "قیمت هر ۳۰ روز"], ["min_gb", "حداقل حجم (GB)"], ["max_gb", "حداکثر حجم (GB)"], ["min_days", "حداقل روز"], ["max_days", "حداکثر روز"]],
}

export default function AdminServices() {
  const { data, error, setData } = useLoad<any>(() => adminGet("/svc-options"))
  const [tab, setTab] = useState<Tab>("payg")
  const kind: Kind = tab === "custom_build" ? "custom_build" : "payg"
  const [busy, setBusy] = useState("")
  const [f, setF] = useState<any>(null)
  const [newName, setNewName] = useState("")
  const [ps, setPs] = useState<any>(null)
  const [mapFor, setMapFor] = useState<any>(null)
  const [cg, setCg] = useState<any>(null)
  const call = async (body: any, ok = "ذخیره شد") => {
    setBusy(body.action)
    try { const r = await adminPost("/svc-options", body); setData(r); toast.success(ok); return true }
    catch (e) { toast.error(friendlyErrorMessage(e, "ناموفق بود")); return false } finally { setBusy("") }
  }
  if (error) return <div className="x-page"><PageTop title="سرویس سفارشی و PAYG" back="/admin/more" /><Alert tone="bad">دریافت ناموفق بود</Alert></div>
  if (!data) return <div className="x-page"><PageTop title="سرویس سفارشی و PAYG" back="/admin/more" /><PageSkeleton /></div>
  const opts: any[] = data[kind].options
  const p = ps ?? data.payg
  return (
    <div className="x-page">
      <PageTop title="سرویس سفارشی و PAYG" sub="قیمت و محدوده‌ی هر گزینه" back="/admin/more" />
      <Segmented<Tab> value={tab} options={[{ value: "payg", label: "PAYG" }, { value: "custom_build", label: "سفارشی" }, { value: "free_test", label: "تست رایگان" }]} onChange={setTab} />
      {tab === "free_test" ? <FreeTests /> : <>
      {tab === "payg" && <Section title="تنظیمات PAYG"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال</span><Switch checked={data.payg.enabled} onChange={(v) => call({ action: "payg_settings", values: { enabled: v } })} /></div>
        <Input label="حداقل موجودی برای ساخت/فعال‌ماندن" type="number" value={p.min_balance} onChange={(e) => setPs({ ...p, min_balance: e.target.value })} />
        <Segmented<string> value={p.empty_action} options={[{ value: "suspend", label: "توقف سرویس" }, { value: "delete", label: "حذف سرویس" }]} onChange={(v) => setPs({ ...p, empty_action: v })} />
        {ps && <Button variant="primary" loading={busy === "payg_settings"} onClick={async () => { if (await call({ action: "payg_settings", values: { min_balance: ps.min_balance, empty_action: ps.empty_action } })) setPs(null) }}>ذخیره</Button>}
      </div></Card></Section>}
      {tab === "custom_build" && <Section title="تنظیمات عمومی سرویس سفارشی"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال (خاموش = سرویس سفارشی برای کاربران بسته است)</span><Switch checked={data.custom_build.enabled !== false} onChange={(v) => call({ action: "custom_enabled", enabled: v })} /></div>
        {(() => { const g = cg ?? data.custom_build.global; return <>
          <div className="x-grid c2"><Input label="قیمت هر گیگ" type="number" value={g.price_per_gb} onChange={(e) => setCg({ ...g, price_per_gb: e.target.value })} /><Input label="قیمت هر ۳۰ روز" type="number" value={g.price_per_30_days} onChange={(e) => setCg({ ...g, price_per_30_days: e.target.value })} /></div>
          <div className="x-grid c2"><Input label="حداقل گیگ" type="number" value={g.min_gb} onChange={(e) => setCg({ ...g, min_gb: e.target.value })} /><Input label="حداکثر گیگ" type="number" value={g.max_gb} onChange={(e) => setCg({ ...g, max_gb: e.target.value })} /></div>
          <div className="x-grid c2"><Input label="حداقل روز" type="number" value={g.min_days} onChange={(e) => setCg({ ...g, min_days: e.target.value })} /><Input label="حداکثر روز" type="number" value={g.max_days} onChange={(e) => setCg({ ...g, max_days: e.target.value })} /></div>
          {cg && <Button variant="primary" loading={busy === "custom_global"} onClick={async () => { if (await call({ action: "custom_global", values: cg })) setCg(null) }}>ذخیره‌ی مقادیر عمومی</Button>}
        </> })()}
      </div></Card></Section>}
      <Section title={kind === "payg" ? "پلن‌های PAYG" : "گزینه‌های سرویس سفارشی"}>
        <div className="x-row-flex"><div className="x-grow"><Input placeholder="نام گزینه‌ی جدید" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
          <Button variant="primary" icon={<Plus size={16} />} disabled={!newName.trim()} loading={busy === "add"} onClick={async () => { if (await call({ action: "add", kind, name: newName.trim() }, "گزینه اضافه شد")) setNewName("") }}>افزودن</Button></div>
        {opts.length === 0 ? <Empty title="گزینه‌ای تعریف نشده" /> : <List>{opts.map((o) => (
          <Row key={o.num} onClick={() => setF({ ...o, vals: { ...o.cfg }, name: o.name })} title={o.name}
            sub={kind === "payg" ? `هر گیگ ${toman(o.effective.price_per_gb)}` : `هر گیگ ${toman(o.effective.price_per_gb)} · ${faDigits(o.effective.min_gb)}–${faDigits(o.effective.max_gb)} GB · ${faDigits(o.effective.min_days)}–${faDigits(o.effective.max_days)} روز`}
            right={o.mapped ? <Chip tone="ok">نگاشت‌شده</Chip> : <Chip tone="warn">بدون نگاشت</Chip>} />))}</List>}
        <Alert tone="ok">برای نگاشت هر گزینه به پنل/تمپلیت، گزینه را باز کنید و «نگاشت پنل» را بزنید.</Alert>
      </Section>
      <Sheet open={!!f} onClose={() => setF(null)} title={f?.name} footer={f && <>
        <Button full onClick={() => setMapFor(f)}>نگاشت پنل</Button>
        <Button variant="primary" size="lg" full loading={busy === "cfg"} onClick={async () => { if (await call({ action: "cfg", kind, num: f.num, values: f.vals })) setF(null) }}>ذخیره</Button>
        <Button full onClick={async () => { if (await call({ action: "cfg", kind, num: f.num, clear: true }, "به مقدار عمومی برگشت")) setF(null) }}>بازگشت به مقدار عمومی</Button>
        <Button variant="danger" full icon={<Trash2 size={15} />} onClick={async () => { if (await ask("این گزینه حذف شود؟") && await call({ action: "remove", kind, num: f.num }, "حذف شد")) setF(null) }}>حذف گزینه</Button></>}>
        {f && <>
          <Input label="نام گزینه" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          {f.name !== opts.find((x) => x.num === f.num)?.name && f.name.trim() && <Button size="sm" onClick={() => call({ action: "rename", kind, num: f.num, name: f.name.trim() })}>ذخیره‌ی نام</Button>}
          {FIELDS[kind].map(([k, label]) => <Input key={k} label={label} type="number" placeholder={String(f.effective[k] ?? "")} value={f.vals[k] ?? ""} onChange={(e) => setF({ ...f, vals: { ...f.vals, [k]: e.target.value } })} />)}
          <div className="x-muted">فیلد خالی = مقدار عمومی.</div>
        </>}
      </Sheet>
      </>}
      {mapFor && <MappingSheet open scope={kind} scopeId={mapFor.num} title={mapFor.name} onClose={() => setMapFor(null)} onDone={() => adminGet("/svc-options").then(setData)} />}
    </div>
  )
}

function FreeTests() {
  const { data, error, setData } = useLoad<any>(() => adminGet("/free-tests"))
  const [f, setF] = useState<any>(null)
  const [mapFor, setMapFor] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const call = async (body: any, ok = "ذخیره شد") => {
    setBusy(true)
    try { const r = await adminPost("/free-tests", body); setData(r); toast.success(ok); return true } catch (e) { toast.error(friendlyErrorMessage(e, "ناموفق بود")); return false } finally { setBusy(false) }
  }
  if (error) return <Alert tone="bad">دریافت ناموفق بود</Alert>
  if (!data) return <PageSkeleton />
  return (
    <>
      <Button full loading={busy} onClick={() => call({ action: "shortcut", value: !data.shortcut }, data.shortcut ? "میانبر خاموش شد" : "میانبر روشن شد")}>{data.shortcut ? "⚡ میانبر: روشن (همه‌ی تست‌ها در یک پیام، بدون QR)" : "⚡ میانبر: خاموش"}</Button>
      <Button variant="primary" icon={<Plus size={16} />} full onClick={() => setF({ isNew: true, name: "", volume_gb: "0.5", duration_unit: "days", duration_value: "1", price: "0" })}>پلن تست جدید</Button>
      {data.items.length === 0 ? <Empty title="پلن تستی تعریف نشده" /> : <List>{data.items.map((e: any) => (
        <Row key={e.id} onClick={() => setF({ ...e, volume_gb: String(e.volume_gb), duration_unit: e.duration_unit || "days", duration_value: String(e.duration_value ?? e.days), price: String(e.price) })} title={e.name}
          sub={`${faDigits(e.volume_gb)} GB · ${faDigits(e.duration_value ?? e.days)} ${e.duration_unit === "hours" ? "ساعت" : "روز"} · ${e.price ? toman(e.price) : "رایگان"}`}
          right={<><Chip tone={e.enabled ? "ok" : undefined}>{e.enabled ? "فعال" : "غیرفعال"}</Chip>{!e.mapped && <Chip tone="warn">بدون نگاشت</Chip>}</>} />))}</List>}
      <Sheet open={!!f} onClose={() => setF(null)} title={f?.isNew ? "پلن تست جدید" : f?.name} footer={f && <>
        <Button variant="primary" size="lg" full loading={busy} disabled={!String(f.name).trim()} onClick={async () => { const b = f.isNew ? { action: "add", ...f } : { action: "edit", id: f.id, name: f.name, volume_gb: f.volume_gb, duration_unit: f.duration_unit, duration_value: f.duration_value, price: f.price }; if (await call(b)) setF(null) }}>ذخیره</Button>
        {!f.isNew && <>
          <Button full onClick={() => setMapFor(f)}>نگاشت پنل</Button>
          <Button full loading={busy} onClick={async () => { if (await call({ action: "toggle", id: f.id }, "تغییر کرد")) setF(null) }}>{f.enabled ? "غیرفعال‌سازی" : "فعال‌سازی"}</Button>
          <Button variant="danger" full icon={<Trash2 size={15} />} onClick={async () => { if (await ask("این پلن تست حذف شود؟") && await call({ action: "remove", id: f.id }, "حذف شد")) setF(null) }}>حذف</Button></>}</>}>
        {f && <>
          <Input label="نام" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input label="حجم (GB، مثلاً 0.5)" type="number" value={f.volume_gb} onChange={(e) => setF({ ...f, volume_gb: e.target.value })} />
          <Segmented<string> value={f.duration_unit || "days"} options={[{ value: "days", label: "روزانه" }, { value: "hours", label: "ساعتی" }]} onChange={(v) => setF({ ...f, duration_unit: v })} />
          <Input label={f.duration_unit === "hours" ? "مدت (ساعت، ۱ تا ۷۲۰)" : "مدت (روز، ۱ تا ۳۰)"} type="number" value={f.duration_value} onChange={(e) => setF({ ...f, duration_value: e.target.value })} />
          <Input label="قیمت (تومان؛ ۰ = رایگان)" type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        </>}
      </Sheet>
      {mapFor && <MappingSheet open scope="free_test" scopeId={mapFor.num} title={mapFor.name} onClose={() => setMapFor(null)} onDone={() => adminGet("/free-tests").then(setData)} />}
    </>
  )
}
