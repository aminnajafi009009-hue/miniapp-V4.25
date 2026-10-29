import { useState } from "react"
import { toast } from "sonner"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Card, Chip, Empty, Input, PageSkeleton, PageTop, Section, Segmented, Switch } from "@/shared/ui/kit"
import { faDigits, toman } from "@/shared/lib/format"

function Referrals() {
  const [page, setPage] = useState(1)
  const { data, error } = useLoad<any>(() => adminGet(`/referrals?page=${page}&per=10`), [page])
  const [open, setOpen] = useState<number | null>(null)
  const [inv, setInv] = useState<any[] | null>(null)
  const show = async (id: number) => {
    if (open === id) { setOpen(null); return }
    try { const r = await adminGet(`/referrals/${id}`); setInv(r.items); setOpen(id) } catch (e) { toast.error(friendlyErrorMessage(e, "دریافت ناموفق بود")) }
  }
  if (error) return <Alert tone="bad">دریافت ناموفق بود</Alert>
  if (!data) return <PageSkeleton />
  return (
    <div className="x-stack">
      {!data.enabled && <Alert tone="warn">سیستم رفرال غیرفعال است (از تب «تنظیمات» روشن می‌شود).</Alert>}
      {data.items.length === 0 ? <Empty title="هنوز کسی دعوت نکرده است" /> : data.items.map((u: any) => (
        <Card key={u.id} tap onClick={() => show(u.id)}>
          <div className="x-between"><div><div className="x-h3">{u.name || u.telegram_id}</div><div className="x-muted">{u.username ? "@" + u.username : u.telegram_id}</div></div>
            <div><Chip>{faDigits(u.invited_count)} دعوت</Chip> <Chip tone="ok">{faDigits(u.successful_invites)} موفق</Chip></div></div>
          {open === u.id && inv && (
            <div className="x-stack" style={{ marginTop: 10 }}>
              {inv.map((x) => <div key={x.id} className="x-between x-muted"><span>{x.name || x.telegram_id}</span><span>{x.status} · {toman(x.reward || 0)}</span></div>)}
            </div>
          )}
        </Card>
      ))}
      <div className="x-row-flex">
        <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</Button>
        <span className="x-grow" style={{ textAlign: "center" }}>{faDigits(page)} / {faDigits(Math.max(1, Math.ceil(data.total / data.per)))}</span>
        <Button disabled={page * data.per >= data.total} onClick={() => setPage(page + 1)}>بعدی</Button>
      </div>
    </div>
  )
}

function Campaigns() {
  const { data, error, setData } = useLoad<any>(() => adminGet("/campaigns"))
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const send = async (body: any) => {
    try { setData(await adminPost("/campaigns", body)); return true } catch (e) { toast.error(friendlyErrorMessage(e, "عملیات ناموفق بود")); return false }
  }
  if (error) return <Alert tone="bad">دریافت ناموفق بود</Alert>
  if (!data) return <PageSkeleton />
  return (
    <div className="x-stack">
      <Section title="کمپین جدید"><Card><div className="x-stack">
        <Input label="کد (انگلیسی)" ltr value={code} onChange={(e) => setCode(e.target.value)} />
        <Input label="نام" value={name} onChange={(e) => setName(e.target.value)} />
        <Button variant="primary" disabled={!code || !name} onClick={async () => { if (await send({ action: "create", code, name })) { setCode(""); setName(""); toast.success("ساخته شد") } }}>ساخت کمپین</Button>
      </div></Card></Section>
      {data.items.map((c: any) => (
        <Card key={c.id}><div className="x-stack">
          <div className="x-between"><div><div className="x-h3">{c.name}</div><div className="x-muted" style={{ direction: "ltr" }}>?start=c_{c.code}</div></div>
            <Switch checked={c.active} onChange={(v) => send({ action: "toggle", id: c.id, active: v })} /></div>
          <div className="x-row-flex"><Chip>{faDigits(c.stats.members)} عضو</Chip><Chip tone="ok">{faDigits(c.stats.converted)} خریدار</Chip><Chip>{toman(c.stats.total_spent)}</Chip></div>
          <Button variant="ghost" size="sm" onClick={() => { if (window.confirm("حذف کمپین؟")) send({ action: "delete", id: c.id }) }}>حذف</Button>
        </div></Card>
      ))}
    </div>
  )
}

function RefSettings() {
  const { data, error, setData } = useLoad<any>(() => adminGet("/referral-settings"))
  const [ref, setRef] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  if (error) return <Alert tone="bad">دریافت ناموفق بود</Alert>
  if (!data) return <PageSkeleton />
  const r = ref ?? data.referral
  const save = async (body: any) => {
    setBusy(true)
    try { const res = await adminPost("/referral-settings", body); setData(res); setRef(null); toast.success("ذخیره شد") }
    catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) } finally { setBusy(false) }
  }
  return (
    <Section title="دعوت از دوستان"><Card><div className="x-stack">
      <div className="x-row-flex"><span className="x-grow">سیستم رفرال (خاموش = همه‌ی بخش‌های دعوت غیرفعال)</span><Switch checked={r.enabled !== false} onChange={(v) => save({ enabled: v })} /></div>
      <div className="x-row-flex"><span className="x-grow">حداقل حجم خرید برای پاداش</span><Switch checked={!!r.min_volume_enabled} onChange={(v) => setRef({ ...r, min_volume_enabled: v })} /></div>
      {r.min_volume_enabled && <Input label="حداقل حجم (گیگ)" type="number" value={r.min_volume_gb} onChange={(e) => setRef({ ...r, min_volume_gb: e.target.value })} />}
      <div className="x-row-flex"><span className="x-grow">فقط خرید پولی</span><Switch checked={!!r.paid_purchase_required} onChange={(v) => setRef({ ...r, paid_purchase_required: v })} /></div>
      <Input label="مبلغ پاداش (تومان)" type="number" value={r.reward_amount} onChange={(e) => setRef({ ...r, reward_amount: e.target.value })} />
      <div className="x-row-flex"><span className="x-grow">قفل پاداش با خروج از کانال</span><Switch checked={!!r.channel_leave_lock_enabled} onChange={(v) => setRef({ ...r, channel_leave_lock_enabled: v })} /></div>
      {ref && <Button variant="primary" loading={busy} onClick={() => save({ min_volume_enabled: ref.min_volume_enabled, min_volume_gb: Number(ref.min_volume_gb), paid_purchase_required: ref.paid_purchase_required, reward_amount: Number(ref.reward_amount), channel_leave_lock_enabled: ref.channel_leave_lock_enabled })}>ذخیره</Button>}
    </div></Card></Section>
  )
}

export default function AdminGrowth() {
  const [tab, setTab] = useState<"ref" | "camp" | "set">("ref")
  return (
    <div className="x-page">
      <PageTop title="رفرال و کمپین‌ها" back="/admin/more" />
      <Segmented<string> value={tab} options={[{ value: "ref", label: "دعوت‌کننده‌ها" }, { value: "camp", label: "کمپین‌ها" }, { value: "set", label: "تنظیمات" }]} onChange={(v) => setTab(v as "ref" | "camp" | "set")} />
      {tab === "ref" ? <Referrals /> : tab === "camp" ? <Campaigns /> : <RefSettings />}
    </div>
  )
}
