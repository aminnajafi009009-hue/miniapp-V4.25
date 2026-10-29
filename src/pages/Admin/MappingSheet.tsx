import { useEffect, useState } from "react"
import { toast } from "sonner"
import { adminGet, adminPost, qs } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { Alert, Button, Chip, Row, Segmented, Sheet, List } from "@/shared/ui/kit"

export type MapScope = "free_test" | "payg" | "custom_build" | "vip_plan" | "vip_category"

/** نگاشت یک مورد (گزینه/پلن/دسته) به پنل + تمپلیت/اینباند، مثل منوی نگاشت ربات. */
export default function MappingSheet({ scope, scopeId, title, open, onClose, onDone }: { scope: MapScope; scopeId: number | string; title: string; open: boolean; onClose: () => void; onDone?: () => void }) {
  const [panels, setPanels] = useState<any[] | null>(null)
  const [cur, setCur] = useState<any>(null)
  const [panelId, setPanelId] = useState<number | null>(null)
  const [mode, setMode] = useState<"template" | "direct">("template")
  const [cat, setCat] = useState<any>(null)
  const [sel, setSel] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setPanelId(null); setCat(null); setSel([]); setMode("template")
    adminGet("/panels/manage").then((r) => setPanels(r.items.filter((p: any) => p.enabled))).catch(() => setPanels([]))
    adminGet(`/mapping${qs({ scope, scope_id: scopeId })}`).then(setCur).catch(() => setCur(null))
  }, [open, scope, scopeId])

  const load = async (pid: number, m: "template" | "direct") => {
    setLoading(true); setCat(null); setSel([])
    try { setCat(await adminGet(`/mapping/catalog${qs({ panel_id: pid, mode: m })}`)) }
    catch (e) { toast.error(friendlyErrorMessage(e, "دریافت لیست از پنل ناموفق بود")) } finally { setLoading(false) }
  }
  const pick = (pid: number) => { setPanelId(pid); setMode("template"); load(pid, "template") }
  const toggle = (i: number) => setSel(mode === "direct" ? (sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i]) : [i])
  const save = async () => {
    setBusy(true)
    try { await adminPost("/mapping", { scope, scope_id: scopeId, panel_id: panelId, mode, idx: sel }); toast.success("نگاشت ذخیره شد"); onDone?.(); onClose() }
    catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) } finally { setBusy(false) }
  }
  const remove = async () => {
    setBusy(true)
    try { await adminPost("/mapping", { scope, scope_id: scopeId, delete: true }); toast.success("نگاشت حذف شد"); onDone?.(); onClose() }
    catch (e) { toast.error(friendlyErrorMessage(e, "ناموفق بود")) } finally { setBusy(false) }
  }
  return (
    <Sheet open={open} onClose={onClose} title={`نگاشت پنل — ${title}`} footer={<>
      {sel.length > 0 && <Button variant="primary" size="lg" full loading={busy} onClick={save}>ذخیره‌ی نگاشت</Button>}
      {cur?.mapped && <Button variant="danger" full loading={busy} onClick={remove}>حذف نگاشت فعلی</Button>}</>}>
      {cur?.mapped && <Alert tone="ok">نگاشت فعلی: {cur.panel} ← {cur.remote}</Alert>}
      {!panels ? <div className="x-muted">در حال دریافت…</div> : panels.length === 0 ? <Alert tone="warn">پنل فعالی ثبت نشده است.</Alert> : <>
        <div className="x-label">پنل را انتخاب کنید</div>
        <div className="x-row-flex" style={{ flexWrap: "wrap" }}>{panels.map((p) => <Chip key={p.id} on={panelId === p.id} onClick={() => pick(p.id)}>{p.name}</Chip>)}</div>
      </>}
      {panelId && cat?.supports_direct && <Segmented<"template" | "direct"> value={mode} options={[{ value: "template", label: "تمپلیت" }, { value: "direct", label: "بدون تمپلیت (چندتایی)" }]} onChange={(m) => { setMode(m); load(panelId, m) }} />}
      {loading && <div className="x-muted">در حال دریافت لیست از پنل…</div>}
      {cat && mode === "direct" && cat.items.length > 1 && <div className="x-row-flex"><Button size="sm" onClick={() => setSel(sel.length === cat.items.length ? [] : cat.items.map((c: any) => c.idx))}>{sel.length === cat.items.length ? "لغو انتخاب همه" : "انتخاب همه (اینباندها/گروه‌ها)"}</Button><span className="x-muted">{sel.length} از {cat.items.length} انتخاب شده</span></div>}
      {cat && <List>{cat.items.map((c: any) => <Row key={c.idx} onClick={() => toggle(c.idx)} title={c.label} right={sel.includes(c.idx) ? <Chip tone="ok">انتخاب شد</Chip> : undefined} />)}</List>}
    </Sheet>
  )
}
