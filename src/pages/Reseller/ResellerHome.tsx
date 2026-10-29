import { toast } from "sonner"
import { Percent, ShoppingBag, PiggyBank, Server, Tag } from "lucide-react"
import { resellerGet, resellerPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { useState } from "react"
import { Alert, BarChart, Button, Card, Chip, Input, PageSkeleton, Section, Stat } from "@/shared/ui/kit"
import { faDigits, num, toman } from "@/shared/lib/format"

export default function ResellerHome() {
  const { data, error, reload } = useLoad<any>(() => resellerGet("/overview"))
  const [prefix, setPrefix] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (error) return <Alert tone="bad">دریافت اطلاعات ناموفق بود. <Button size="sm" onClick={reload}>تلاش مجدد</Button></Alert>
  if (!data) return <PageSkeleton />
  const savePrefix = async () => { setBusy(true); try { await resellerPost("/prefix", { prefix }); toast.success("پیشوند ذخیره شد"); setPrefix(null); await reload() } catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) } finally { setBusy(false) } }
  return (
    <div className="x-stack">
      <Card hero><div className="x-stack" style={{ gap: 6 }}>
        <div className="x-row-flex"><Percent size={17} /><span className="x-sub">تخفیف نمایندگی شما</span></div>
        <div className="x-h1 num">{faDigits(data.percent)}٪</div>
        <div className="x-muted">موجودی: {toman(data.wallet)}{data.locked_wallet > 0 ? ` · قفل: ${toman(data.locked_wallet)}` : ""}</div>
        {data.categories && <div className="x-row-flex" style={{ flexWrap: "wrap" }}>{data.categories.map((c: string) => <Chip key={c}>{c}</Chip>)}</div>}
      </div></Card>
      <div className="x-grid c2">
        <Stat label="خرید ۳۰ روز اخیر" value={num(data.spent_30d)} icon={<ShoppingBag size={16} />} tone="blue" sub="تومان" />
        <Stat label="صرفه‌جویی تقریبی" value={num(data.estimated_saving)} icon={<PiggyBank size={16} />} tone="green" sub="تومان" />
        <Stat label="سرویس‌های من" value={num(data.services)} icon={<Server size={16} />} tone="cyan" />
      </div>
      {(data.test_quota > 0 || (data.option_discounts || []).some((o: any) => o.percent > 0)) && <Section title="سهمیه و تخفیف‌های ویژه"><Card><div className="x-stack" style={{ gap: 6 }}>
        {data.test_quota > 0 && <div className="x-between"><span>سهمیه‌ی تست ماهانه</span><b className="num">{faDigits(data.tests_used)} از {faDigits(data.test_quota)}</b></div>}
        {(data.option_discounts || []).filter((o: any) => o.percent > 0).map((o: any, i: number) => <div key={i} className="x-between"><span>{o.kind_label} — {o.name}</span><b className="num">{faDigits(o.percent)}٪</b></div>)}
      </div></Card></Section>}
      <Section title="خرید ۱۴ روز اخیر"><Card><BarChart data={data.series.map((d: any) => ({ label: d.d.slice(5), value: d.value }))} format={toman} /></Card></Section>
      <Section title="پیشوند نام سرویس"><Card><div className="x-stack">
        <Input label="پیشوند دلخواه (انگلیسی/عدد)" ltr icon={<Tag size={15} />} value={prefix ?? data.prefix} maxLength={12} onChange={(e) => setPrefix(e.target.value)} hint="نام سرویس‌هایی که می‌سازید با این پیشوند شروع می‌شود." />
        {prefix !== null && prefix !== data.prefix && <Button variant="primary" loading={busy} onClick={savePrefix}>ذخیره</Button>}
      </div></Card></Section>
    </div>
  )
}
