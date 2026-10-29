import { useState } from "react"
import { adminGet, qs } from "@/shared/api/admin"
import { useLoad } from "@/shared/lib/useLoad"
import { Button, Chip, Empty, PageSkeleton, PageTop, Row, Tabs, List } from "@/shared/ui/kit"
import { faDigits, jalaliDate, num } from "@/shared/lib/format"

const ST: Record<string, { l: string; t: "ok" | "warn" | "bad" | "info" }> = {
  completed: { l: "تکمیل", t: "ok" }, paid: { l: "پرداخت‌شده", t: "ok" }, active: { l: "فعال", t: "ok" }, fulfilled: { l: "تحویل شد", t: "ok" },
  processing: { l: "در حال انجام", t: "info" }, pending: { l: "در انتظار", t: "warn" }, rejected: { l: "رد شد", t: "bad" }, cancelled: { l: "لغو", t: "bad" },
}
const TYPE: Record<string, string> = { new: "جدید", renew: "تمدید", test: "تست", wallet_charge: "شارژ", payg: "PAYG" }

export default function AdminOrders() {
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const { data, error, reload } = useLoad<any>(() => adminGet(`/orders${qs({ status, page })}`), [status, page])
  const counts = data?.counts || {}
  const opts = [{ value: "", label: "همه" }, ...Object.keys(counts).map((k) => ({ value: k, label: ST[k]?.l || k, count: counts[k] }))]
  return (
    <div className="x-page">
      <PageTop title="سفارش‌ها" sub={data ? `${num(data.total)} مورد` : undefined} back="/admin/more" />
      <Tabs value={status} options={opts} onChange={(v) => { setStatus(v); setPage(1) }} />
      {error ? <Empty title="خطا در دریافت" action={<Button onClick={reload}>تلاش مجدد</Button>} /> : !data ? <PageSkeleton /> : data.items.length === 0 ? <Empty title="سفارشی نیست" /> : (
        <List>
          {data.items.map((o: any) => (
            <Row key={o.id} href={o.telegram_id ? `/admin/users/${o.telegram_id}` : undefined} title={o.plan_name} sub={`${o.user_name || "—"} · ${TYPE[o.order_type] || o.order_type} · ${jalaliDate(o.created_at, true)}`}
              right={<span className="x-stack" style={{ gap: 2, alignItems: "flex-end" }}><b className="num">{num(o.price)}</b><Chip tone={ST[o.status]?.t || "info"}>{ST[o.status]?.l || o.status}</Chip></span>} />
          ))}
        </List>
      )}
      {data && data.total > data.per && (
        <div className="x-row-flex" style={{ justifyContent: "center" }}>
          <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</Button>
          <span className="x-sub">{faDigits(page)} / {faDigits(Math.ceil(data.total / data.per))}</span>
          <Button disabled={page * data.per >= data.total} onClick={() => setPage(page + 1)}>بعدی</Button>
        </div>
      )}
    </div>
  )
}
