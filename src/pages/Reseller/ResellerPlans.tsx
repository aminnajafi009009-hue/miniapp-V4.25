import { resellerGet } from "@/shared/api/admin"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Chip, Empty, PageSkeleton, PageTop, Row, Section, List } from "@/shared/ui/kit"
import { faDigits, num } from "@/shared/lib/format"

export default function ResellerPlans() {
  const { data, error } = useLoad<any>(() => resellerGet("/plans"))
  return (
    <div className="x-stack">
      <PageTop title="پلن‌ها و قیمت نمایندگی" />
      {error ? <Alert tone="bad">دریافت ناموفق بود</Alert> : !data ? <PageSkeleton /> : data.categories.length === 0 ? <Empty title="پلنی در دسترس نیست" /> : data.categories.map((c: any) => (
        <Section key={c.id} title={c.name}>
          <List>{c.plans.map((p: any) => (
            <Row key={p.key} chevron={false} title={p.name} sub={`${p.volume_gb ? faDigits(p.volume_gb) + " گیگ" : "حجم ∞"} · ${p.days ? faDigits(p.days) + " روز" : "زمان ∞"}`}
              right={<span className="x-stack" style={{ gap: 2, alignItems: "flex-end" }}><b className="num">{num(p.agent_price)}</b>{p.percent > 0 && <span className="x-muted" style={{ textDecoration: "line-through" }}>{num(p.price)}</span>}{p.percent > 0 && <Chip tone="ok">{faDigits(p.percent)}٪</Chip>}</span>} />
          ))}</List>
        </Section>
      ))}
    </div>
  )
}
