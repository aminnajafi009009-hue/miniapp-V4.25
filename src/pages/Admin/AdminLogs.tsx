import { useState } from "react"
import { adminGet, qs } from "@/shared/api/admin"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Empty, PageSkeleton, PageTop, Row, Segmented, List } from "@/shared/ui/kit"
import { jalaliDate } from "@/shared/lib/format"

export default function AdminLogs() {
  const [tab, setTab] = useState<"admin" | "errors">("admin")
  const { data, error } = useLoad<any>(() => adminGet(`/logs${qs({ tab })}`), [tab])
  return (
    <div className="x-page">
      <PageTop title="لاگ‌ها" back="/admin/more" />
      <Segmented<"admin" | "errors"> value={tab} options={[{ value: "admin", label: "فعالیت ادمین‌ها" }, { value: "errors", label: "خطاها" }]} onChange={setTab} />
      {error ? <Alert tone="bad">دریافت ناموفق بود</Alert> : !data ? <PageSkeleton /> : data.items.length === 0 ? <Empty title="موردی ثبت نشده" /> : (
        <List>{data.items.map((r: any) => tab === "admin"
          ? <Row key={r.id} chevron={false} title={`${r.admin || "—"} · ${r.action}`} sub={`${r.target || ""} ${r.details || ""} · ${jalaliDate(r.created_at, true)}`} />
          : <Row key={r.id} chevron={false} title={r.title || r.where} sub={`${r.where} · ${jalaliDate(r.created_at, true)}`} />)}</List>
      )}
    </div>
  )
}
