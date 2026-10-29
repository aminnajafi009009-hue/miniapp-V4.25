import { Link } from "react-router-dom"
import { Users, ShoppingBag, Wallet, Ticket, Receipt, Activity, Power, TrendingUp, Server, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { adminGet, adminPost, useAdminStore } from "@/shared/api/admin"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, BarChart, Button, Card, Empty, PageSkeleton, Row, Section, Sparkline, Stat, Switch, List } from "@/shared/ui/kit"
import { faDigits, num, toman } from "@/shared/lib/format"
import { friendlyErrorMessage } from "@/shared/api/client"

export default function AdminHome() {
  const me = useAdminStore((s) => s.me)
  const can = useAdminStore((s) => s.can)
  const { data, error, reload, setData } = useLoad<any>(() => (can("stats") ? adminGet("/overview") : Promise.resolve(null)), [me?.name, me?.sections?.length])
  if (!me) return <PageSkeleton />
  if (!can("stats")) return (
    <div className="x-stack">
      <Card hero><div className="x-h2">سلام {me.name}</div><div className="x-sub">برای این حساب بخش «آمار» فعال نیست؛ از «بیشتر» به بخش‌های مجاز بروید.</div></Card>
      <Link to="/admin/more"><Button full variant="primary">همه‌ی بخش‌ها</Button></Link>
    </div>
  )
  if (error) return <Alert tone="bad">دریافت آمار ناموفق بود. <Button size="sm" onClick={reload}>تلاش مجدد</Button></Alert>
  if (!data) return <PageSkeleton />
  const toggleOrders = async (v: boolean) => {
    try { await adminPost("/orders-toggle", { enabled: v }); setData({ ...data, orders_enabled: v }); toast.success(v ? "سفارش‌ها باز شد" : "سفارش‌ها بسته شد") }
    catch (e) { toast.error(friendlyErrorMessage(e, "تغییر ناموفق بود")) }
  }
  const alerts = [
    data.pending_receipts > 0 && { to: "/admin/receipts", t: `${faDigits(data.pending_receipts)} رسید در انتظار تأیید`, icon: <Receipt size={19} />, tone: "warn" as const, s: "recv" },
    data.open_tickets > 0 && { to: "/admin/tickets", t: `${faDigits(data.open_tickets)} تیکت باز`, icon: <Ticket size={19} />, tone: "pink" as const, s: "tick" },
    data.pending_orders > 0 && { to: "/admin/orders", t: `${faDigits(data.pending_orders)} سفارش در حال انتظار`, icon: <ShoppingBag size={19} />, tone: "blue" as const, s: "ord" },
  ].filter(Boolean) as any[]
  const rev = (data.series || []).map((d: any) => d.revenue)
  return (
    <div className="x-stack">
      <Card hero>
        <div className="x-stack" style={{ gap: 6 }}>
          <div className="x-row-flex"><TrendingUp size={17} /><span className="x-sub">فروش امروز</span></div>
          <div className="x-h1 num">{toman(data.revenue_today)}</div>
          <Sparkline values={rev} />
          <div className="x-row-flex x-muted" style={{ justifyContent: "space-between" }}><span>۷ روز: {toman(data.revenue_7d)}</span><span>۳۰ روز: {toman(data.revenue_30d)}</span></div>
        </div>
      </Card>
      {alerts.length > 0 && <Section title="نیازمند اقدام"><List>{alerts.map((a) => <Row key={a.s} href={a.to} icon={a.icon} tone={a.tone} title={a.t} />)}</List></Section>}
      <div className="x-grid c2">
        <Stat label="کاربران" value={num(data.users)} icon={<Users size={16} />} tone="blue" sub={`امروز +${faDigits(data.new_users_today)}`} />
        <Stat label="سرویس فعال" value={num(data.services)} icon={<Server size={16} />} tone="violet" />
        <Stat label="مشتریان" value={num(data.customers)} icon={<UserPlus size={16} />} tone="green" />
        <Stat label="کاربر فعال ۳۰ روز" value={num(data.active_users_30d)} icon={<Activity size={16} />} tone="cyan" />
        <Stat label="سفارش امروز" value={num(data.orders_today)} icon={<ShoppingBag size={16} />} tone="gold" />
        <Stat label="موجودی کیف‌پول‌ها" value={num(data.wallets_total)} icon={<Wallet size={16} />} tone="pink" />
      </div>
      <Section title="فروش ۱۴ روز اخیر"><Card><BarChart data={(data.series || []).map((d: any) => ({ label: d.d.slice(5), value: d.revenue }))} format={toman} /></Card></Section>
      <Section title="کاربران جدید ۱۴ روز اخیر"><Card><BarChart data={(data.series || []).map((d: any) => ({ label: d.d.slice(5), value: d.users }))} /></Card></Section>
      {me.is_main || can("orders_toggle") ? (
        <Card><div className="x-row-flex"><Power size={18} color={data.orders_enabled ? "var(--ok)" : "var(--bad)"} /><div className="x-grow"><div className="x-h3">دریافت سفارش</div><div className="x-muted">{data.orders_enabled ? "سفارش‌ها باز است" : "سفارش‌ها بسته است"}</div></div><Switch checked={!!data.orders_enabled} onChange={toggleOrders} /></div></Card>
      ) : null}
      {!data.orders_enabled && <Empty title="سفارش‌گیری بسته است" sub="کاربران نمی‌توانند خرید جدید ثبت کنند." />}
    </div>
  )
}
