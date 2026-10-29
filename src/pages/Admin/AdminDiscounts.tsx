import { useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, Copy } from "lucide-react"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { ask } from "@/shared/lib/confirm"
import { Button, Chip, Empty, Input, PageSkeleton, PageTop, Row, Segmented, Sheet, Switch, List, Alert } from "@/shared/ui/kit"
import { copyText, faDigits, num } from "@/shared/lib/format"

const blank = { code: "", type: "percent", percent: "10", amount: "", uses: "10", min_order_amount: "", max_uses_per_user: "1", expires_at: "", first_purchase_only: false }

export default function AdminDiscounts() {
  const { data, error, reload } = useLoad<any>(() => adminGet("/discounts"))
  const [f, setF] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    try {
      const body = { ...f, percent: Number(f.percent), amount: Number(f.amount), uses: Number(f.uses), min_order_amount: Number(f.min_order_amount || 0), max_uses_per_user: Number(f.max_uses_per_user || 0), expires_at: f.expires_at || null }
      await adminPost(f.id ? `/discounts/${f.id}` : "/discounts", body); toast.success("ذخیره شد"); setF(null); await reload()
    } catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) } finally { setBusy(false) }
  }
  const del = async (d: any) => { if (await ask(`کد ${d.code} حذف شود؟`)) { try { await adminPost(`/discounts/${d.id}/delete`); toast.success("حذف شد"); setF(null); await reload() } catch (e) { toast.error(friendlyErrorMessage(e, "حذف ناموفق بود")) } } }
  const set = (k: string, v: any) => setF({ ...f, [k]: v })
  const edit = (d: any) => setF({ id: d.id, code: d.code, type: d.type, percent: String(d.percent), amount: String(d.amount || ""), uses: String(d.uses), min_order_amount: String(d.min_order_amount || ""), max_uses_per_user: String(d.max_uses_per_user || ""), expires_at: (d.expires_at || "").slice(0, 16).replace(" ", "T"), first_purchase_only: d.first_purchase_only })
  return (
    <div className="x-page">
      <PageTop title="کدهای تخفیف" back="/admin/more" right={<Button size="sm" variant="primary" icon={<Plus size={15} />} onClick={() => setF({ ...blank })}>جدید</Button>} />
      {error ? <Alert tone="bad">دریافت ناموفق بود</Alert> : !data ? <PageSkeleton /> : data.items.length === 0 ? <Empty title="کدی ساخته نشده" /> : (
        <List>{data.items.map((d: any) => (
          <Row key={d.id} onClick={() => edit(d)} title={<span dir="ltr">{d.code}</span>} sub={`${d.type === "amount" ? num(d.amount) + " تومان" : faDigits(d.percent) + "٪"} · ${faDigits(d.uses)} استفاده${d.expires_at ? " · تا " + d.expires_at.slice(0, 10) : ""}`}
            right={<span className="x-row-flex">{d.first_purchase_only && <Chip tone="info">اولین خرید</Chip>}<Button size="sm" iconOnly icon={<Copy size={14} />} onClick={(e) => { e.stopPropagation(); void copyText(d.code); toast.success("کپی شد") }} /></span>} />
        ))}</List>
      )}
      <Sheet open={!!f} onClose={() => setF(null)} title={f?.id ? "ویرایش کد" : "کد تخفیف جدید"}
        footer={f && <><Button variant="primary" size="lg" full loading={busy} onClick={save}>ذخیره</Button>{f.id && <Button variant="danger" full icon={<Trash2 size={15} />} onClick={() => del(f)}>حذف کد</Button>}</>}>
        {f && <>
          <Input label="کد (انگلیسی)" ltr disabled={!!f.id} value={f.code} onChange={(e) => set("code", e.target.value)} />
          <Segmented<string> value={f.type} options={[{ value: "percent", label: "درصدی" }, { value: "amount", label: "مبلغ ثابت" }]} onChange={(v) => set("type", v)} />
          {f.type === "percent" ? <Input label="درصد (۱ تا ۱۰۰)" type="number" value={f.percent} onChange={(e) => set("percent", e.target.value)} /> : <Input label="مبلغ تخفیف (تومان)" type="number" value={f.amount} onChange={(e) => set("amount", e.target.value)} />}
          <Input label="تعداد کل استفاده" type="number" value={f.uses} onChange={(e) => set("uses", e.target.value)} />
          <Input label="سقف استفاده برای هر کاربر (۰ = نامحدود)" type="number" value={f.max_uses_per_user} onChange={(e) => set("max_uses_per_user", e.target.value)} />
          <Input label="حداقل مبلغ سفارش" type="number" value={f.min_order_amount} onChange={(e) => set("min_order_amount", e.target.value)} />
          <Input label="انقضا (اختیاری)" type="datetime-local" ltr value={f.expires_at} onChange={(e) => set("expires_at", e.target.value)} />
          <div className="x-row-flex"><span className="x-grow">فقط برای اولین خرید</span><Switch checked={f.first_purchase_only} onChange={(v) => set("first_purchase_only", v)} /></div>
        </>}
      </Sheet>
    </div>
  )
}
