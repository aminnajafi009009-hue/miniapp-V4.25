import { txMeta, TxAmount } from "@/shared/lib/tx"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { resellerGet } from "@/shared/api/admin"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Card, Empty, PageSkeleton, PageTop, Row, Section, List } from "@/shared/ui/kit"
import { jalaliDate, toman } from "@/shared/lib/format"

export default function ResellerWallet() {
  const { data, error } = useLoad<any>(() => resellerGet("/wallet"))
  return (
    <div className="x-stack">
      <PageTop title="کیف پول نمایندگی" />
      {error ? <Alert tone="bad">دریافت ناموفق بود</Alert> : !data ? <PageSkeleton /> : (
        <>
          <Card hero><div className="x-stack" style={{ gap: 6 }}><div className="x-sub">موجودی قابل استفاده</div><div className="x-h1 num">{toman(data.wallet)}</div>
            {data.locked_wallet > 0 && <div className="x-muted">قفل: {toman(data.locked_wallet)}</div>}
            <Link to="/wallet"><Button variant="primary" icon={<Plus size={16} />}>شارژ کیف پول</Button></Link></div></Card>
          <Section title="تراکنش‌ها">{data.transactions.length === 0 ? <Empty title="تراکنشی نیست" /> : <List>{data.transactions.map((t: any, i: number) => <Row key={i} chevron={false} icon={txMeta(t).icon} tone={txMeta(t).tone} title={t.description || t.type} sub={jalaliDate(t.created_at, true)} right={<TxAmount t={t} />} />)}</List>}</Section>
        </>
      )}
    </div>
  )
}
