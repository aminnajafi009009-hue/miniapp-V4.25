import { useState } from "react"
import { toast } from "sonner"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Card, Chip, Empty, Input, PageSkeleton, PageTop, Section, Textarea } from "@/shared/ui/kit"

export default function AdminGuides() {
  const { data, error, setData } = useLoad<any>(() => adminGet("/guides"))
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const send = async (b: any) => {
    try { setData(await adminPost("/guides", b)); return true } catch (e) { toast.error(friendlyErrorMessage(e, "عملیات ناموفق بود")); return false }
  }
  if (error) return <div className="x-page"><PageTop title="راهنماها" back="/admin/more" /><Alert tone="bad">دریافت ناموفق بود</Alert></div>
  if (!data) return <div className="x-page"><PageTop title="راهنماها" back="/admin/more" /><PageSkeleton /></div>
  const submit = async () => {
    const ok = editId ? await send({ action: "update", id: editId, title, body_text: body }) : await send({ action: "create", title, body_text: body })
    if (ok) { setTitle(""); setBody(""); setEditId(null); toast.success("ذخیره شد") }
  }
  return (
    <div className="x-page">
      <PageTop title="راهنماها" back="/admin/more" />
      <Section title={editId ? "ویرایش راهنما" : "راهنمای جدید"}><Card><div className="x-stack">
        <Input label="عنوان" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="متن" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
        <Button variant="primary" disabled={!title.trim() || !body.trim()} onClick={submit}>{editId ? "ذخیره" : "افزودن"}</Button>
        {editId && <Button variant="ghost" onClick={() => { setEditId(null); setTitle(""); setBody("") }}>انصراف</Button>}
        <div className="x-muted">راهنماهای تصویری/فایلی از داخل ربات ساخته می‌شوند.</div>
      </div></Card></Section>
      {data.items.length === 0 ? <Empty title="راهنمایی ثبت نشده" /> : data.items.map((g: any) => (
        <Card key={g.id}><div className="x-stack">
          <div className="x-between"><div className="x-h3">{g.title}</div>{g.content_type !== "text" && <Chip>{g.content_type}</Chip>}</div>
          <div className="x-row-flex">
            {g.content_type === "text" && <Button size="sm" onClick={() => { setEditId(g.id); setTitle(g.title); setBody(g.body_text) }}>ویرایش</Button>}
            <Button size="sm" onClick={() => send({ action: "up", id: g.id })}>↑</Button>
            <Button size="sm" onClick={() => send({ action: "down", id: g.id })}>↓</Button>
            <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("حذف شود؟")) send({ action: "delete", id: g.id }) }}>حذف</Button>
          </div>
        </div></Card>
      ))}
    </div>
  )
}
