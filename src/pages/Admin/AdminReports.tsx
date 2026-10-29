import { useState } from "react"
import { adminGet } from "@/shared/api/admin"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, BarChart, Card, Donut, KV, PageSkeleton, PageTop, Row, Section, Segmented, Stat, List, Empty } from "@/shared/ui/kit"
import { faDigits, num, toman } from "@/shared/lib/format"

const TYPE: Record<string, string> = { new: "خرید جدید", renew: "تمدید", test: "تست", payg: "PAYG" }
const COLORS = ["var(--accent)", "var(--accent-2)", "#f5a524", "#34d399", "#f472b6"]

export default function AdminReports() {
  const [days, setDays] = useState(30)
  const { data, error } = useLoad<any>(() => adminGet(`/reports?days=${days}`), [days])
  return (
    <div className="x-page">
      <PageTop title="گزارش فروش" back="/admin" />
      <Segmented<number> value={days} options={[{ value: 7, label: "۷ روز" }, { value: 30, label: "۳۰ روز" }, { value: 90, label: "۹۰ روز" }]} onChange={setDays} />
      {error ? <Alert tone="bad">دریافت گزارش ناموفق بود.</Alert> : !data ? <PageSkeleton /> : (
        <>
          <div className="x-grid c2">
            <Stat label="درآمد دوره" value={num(data.total_revenue)} sub="تومان" />
            <Stat label="تعداد سفارش" value={num(data.total_orders)} />
            <Stat label="کاربر جدید" value={num(data.new_users)} />
            <Stat label="میانگین هر سفارش" value={num(data.total_orders ? Math.round(data.total_revenue / data.total_orders) : 0)} sub="تومان" />
          </div>
          <Section title="درآمد روزانه"><Card><BarChart data={data.series.map((d: any) => ({ label: d.d.slice(5), value: d.revenue }))} format={toman} height={140} /></Card></Section>
          {data.by_type.length > 0 && (
            <Section title="نوع سفارش"><Card><div className="x-row-flex">
              <Donut parts={data.by_type.map((t: any, i: number) => ({ value: t.s, color: COLORS[i % COLORS.length], label: t.t }))} center={<b className="num">{faDigits(data.by_type.reduce((a: number, t: any) => a + t.c, 0))}</b>} />
              <div className="x-grow x-stack" style={{ gap: 6 }}>{data.by_type.map((t: any, i: number) => <KV key={t.t} k={<span><i style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, background: COLORS[i % COLORS.length], marginInlineEnd: 6 }} />{TYPE[t.t] || t.t}</span>} v={`${faDigits(t.c)} · ${num(t.s)}`} />)}</div>
            </div></Card></Section>
          )}
          <Section title="پرفروش‌ترین پلن‌ها">{data.top_plans.length === 0 ? <Empty title="داده‌ای نیست" /> : <List>{data.top_plans.map((p: any, i: number) => <Row key={i} chevron={false} title={p.name} sub={`${faDigits(p.c)} فروش`} right={<b className="num">{num(p.s)}</b>} />)}</List>}</Section>
          <Section title="بهترین مشتریان">{data.top_buyers.length === 0 ? <Empty title="داده‌ای نیست" /> : <List>{data.top_buyers.map((p: any) => <Row key={p.telegram_id} href={`/admin/users/${p.telegram_id}`} title={p.name} sub={`${faDigits(p.c)} سفارش`} right={<b className="num">{num(p.s)}</b>} />)}</List>}</Section>
        </>
      )}
    </div>
  )
}
