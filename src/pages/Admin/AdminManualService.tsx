import { useState } from "react"
import { toast } from "sonner"
import { adminGet, adminPost, qs } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Card, Chip, Empty, Input, PageSkeleton, PageTop, Row, Section, Segmented, List } from "@/shared/ui/kit"

interface Panel { id: number; label: string; type: string; supports_direct: boolean }
interface Item { idx: number; label: string; protocol?: string }

export default function AdminManualService() {
  const { data, error } = useLoad<{ items: Panel[] }>(() => adminGet("/manual-service/panels"))
  const [panel, setPanel] = useState<Panel | null>(null)
  const [mode, setMode] = useState<"template" | "direct">("template")
  const [items, setItems] = useState<Item[] | null>(null)
  const [picked, setPicked] = useState<number[]>([])
  const [vol, setVol] = useState("")
  const [days, setDays] = useState("")
  const [name, setName] = useState("")
  const [target, setTarget] = useState("")
  const [busy, setBusy] = useState(false)

  const loadCatalog = async (p: Panel, m: "template" | "direct") => {
    setBusy(true); setItems(null); setPicked([])
    try { const r: { items: Item[] } = await adminGet(`/manual-service/catalog${qs({ panel_id: p.id, mode: m })}`); setItems(r.items) }
    catch (e) { toast.error(friendlyErrorMessage(e, "دریافت لیست از پنل ناموفق بود")) } finally { setBusy(false) }
  }
  const choosePanel = (p: Panel) => { setPanel(p); setMode("template"); loadCatalog(p, "template") }
  const toggle = (i: number) => setPicked((s) => (mode === "template" ? [i] : s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))
  const ready = !!panel && picked.length > 0 && Number(vol) > 0 && Number(days) > 0 && (!name || /^[A-Za-z0-9]{1,32}$/.test(name))
  const create = async () => {
    if (!panel) return
    setBusy(true)
    try {
      await adminPost("/manual-service", { panel_id: panel.id, mode, idx: picked, volume_gb: Number(vol), days: Number(days), name: name.trim() || undefined, target_tid: target.trim() || undefined })
      toast.success("سرویس ساخته و ارسال شد"); setVol(""); setDays(""); setName("")
    } catch (e) { toast.error(friendlyErrorMessage(e, "ساخت سرویس ناموفق بود")) } finally { setBusy(false) }
  }
  if (error) return <div className="x-page"><PageTop title="ساخت سرویس دستی" back="/admin/more" /><Alert tone="bad">دریافت ناموفق بود</Alert></div>
  if (!data) return <div className="x-page"><PageTop title="ساخت سرویس دستی" back="/admin/more" /><PageSkeleton /></div>
  return (
    <div className="x-page">
      <PageTop title="ساخت سرویس دستی" sub="رایگان، بدون محدودیت حجم/روز" back="/admin/more" />
      {data.items.length === 0 ? <Empty title="پنل فعالی ثبت نشده" sub="اول یک پنل VPN اضافه کنید." /> : (
        <Section title="۱) پنل"><List>{data.items.map((p) => (
          <Row key={p.id} onClick={() => choosePanel(p)} title={p.label} right={panel?.id === p.id ? <Chip tone="ok">انتخاب‌شده</Chip> : undefined} />
        ))}</List></Section>
      )}
      {panel && <Section title="۲) تمپلیت / گروه">
        {panel.supports_direct && <Segmented<"template" | "direct"> value={mode} options={[{ value: "template", label: "تمپلیت" }, { value: "direct", label: "مستقیم (گروه/اینباند)" }]} onChange={(m) => { setMode(m); loadCatalog(panel, m) }} />}
        {busy && !items ? <PageSkeleton /> : items && <List>{items.map((c) => (
          <Row key={c.idx} onClick={() => toggle(c.idx)} title={c.label} sub={c.protocol} right={picked.includes(c.idx) ? <Chip tone="ok">✓</Chip> : undefined} />
        ))}</List>}
      </Section>}
      {panel && items && <Section title="۳) مشخصات"><Card><div className="x-stack">
        <Input label="حجم (گیگابایت)" type="number" value={vol} onChange={(e) => setVol(e.target.value)} />
        <Input label="مدت (روز)" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
        <Input label="نام سرویس (لاتین، اختیاری)" ltr value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="آیدی عددی کاربر مقصد (خالی = خودم)" ltr value={target} onChange={(e) => setTarget(e.target.value)} />
        <Button variant="primary" size="lg" full disabled={!ready} loading={busy} onClick={create}>ساخت و ارسال</Button>
      </div></Card></Section>}
    </div>
  )
}
