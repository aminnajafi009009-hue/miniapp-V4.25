import { useState } from "react"
import { resellerGet, qs } from "@/shared/api/admin"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Chip, Empty, PageSkeleton, PageTop, Row, List } from "@/shared/ui/kit"
import { faDigits, jalaliDate, num } from "@/shared/lib/format"

export default function ResellerSales() {
  const [page, setPage] = useState(1)
  const { data, error, reload } = useLoad<any>(() => resellerGet(`/sales${qs({ page })}`), [page])
  return (
    <div className="x-stack">
      <PageTop title="فروش و سفارش‌ها" />
      {error ? <Alert tone="bad">دریافت ناموفق بود <Button size="sm" onClick={reload}>تلاش مجدد</Button></Alert> : !data ? <PageSkeleton /> : (
        data.items.length === 0 ? <Empty title="هنوز سفارشی ثبت نشده" /> : <>
          <List>{data.items.map((o: any) => <Row key={o.id} chevron={false} title={o.plan_name} sub={jalaliDate(o.created_at, true)} right={<span className="x-stack" style={{ gap: 2, alignItems: "flex-end" }}><b className="num">{num(o.price)}</b><Chip tone={["completed", "paid", "active", "fulfilled"].includes(o.status) ? "ok" : "warn"}>{o.status}</Chip></span>} />)}</List>
          {data.total > data.per && <div className="x-row-flex" style={{ justifyContent: "center" }}><Button disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</Button><span className="x-sub">{faDigits(page)}</span><Button disabled={page * data.per >= data.total} onClick={() => setPage(page + 1)}>بعدی</Button></div>}
        </>
      )}
    </div>
  )
}
