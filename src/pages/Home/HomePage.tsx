import { txMeta, TxAmount } from "@/shared/lib/tx"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ShoppingCart, Wallet as WalletIcon, Gift, Users, Headphones, Ticket, RefreshCw, SlidersHorizontal, Gauge, Plus,
  AlertTriangle, ShieldCheck, Megaphone, ArrowDownLeft, ArrowUpRight, Activity, Crown, Store, Server,
} from "lucide-react"
import { getHome, getMe, getServices } from "@/shared/api/services"
import type { HomeData } from "@/shared/api/types"
import { useUserStore } from "@/shared/store/userStore"
import { Alert, Avatar, Button, Card, Chip, Empty, Ring, Row, Section, Skeleton, Tile, type Tone } from "@/shared/ui/kit"
import { formatBytes, jalaliDate, num, timeAgo, toman, faDigits } from "@/shared/lib/format"
import { isExpiring } from "../Services/status"

async function loadHome(): Promise<HomeData> {
  try {
    return await getHome()
  } catch {
    // fallback for older backends: compose from /me + /services
    const [me, sv] = await Promise.all([getMe(), getServices().catch(() => ({ vip: [] }))])
    const list = sv.vip || []
    const attention: HomeData["attention"] = list.filter(isExpiring).slice(0, 5).map((s) => ({
      id: s.id, title: s.title || s.plan,
      kind: (s.remaining_days ?? 99) <= 5 ? "expiring" : "low_traffic",
      remaining_days: s.remaining_days, percent: s.usage?.percent,
    }))
    return {
      name: me.name, wallet: me.wallet, orders_enabled: me.orders_enabled,
      free_trial_available: true, custom_build_enabled: true,
      services: {
        total: list.length,
        active: list.filter((s) => !s.status || s.status === "active" || s.status === "on_hold").length,
        total_used: list.reduce((a, s) => a + (s.usage?.used || 0), 0),
        total_quota: list.reduce((a, s) => a + (s.usage?.total || 0), 0),
      },
      attention, activity: [],
    }
  }
}

const ACT_ICON: Record<string, { icon: React.ReactNode; tone: Tone }> = {
  topup: { icon: <ArrowDownLeft size={17} />, tone: "ok" },
  purchase: { icon: <ShoppingCart size={17} />, tone: "blue" },
  renew: { icon: <RefreshCw size={17} />, tone: "cyan" },
  referral: { icon: <Gift size={17} />, tone: "pink" },
  refund: { icon: <ArrowDownLeft size={17} />, tone: "ok" },
  withdraw: { icon: <ArrowUpRight size={17} />, tone: "warn" },
}

export default function HomePage() {
  const nav = useNavigate()
  const { user, fetchUser } = useUserStore()
  const [data, setData] = useState<HomeData | null>(null)
  const [err, setErr] = useState(false)

  const load = useCallback(() => {
    setErr(false)
    loadHome().then(setData).catch(() => setErr(true))
  }, [])
  useEffect(() => { fetchUser(); load() }, [fetchUser, load])

  const name = data?.name || user?.name || ""
  const sv = data?.services
  const pct = sv && sv.total_quota > 0 ? Math.min(100, Math.round((sv.total_used / sv.total_quota) * 100)) : 0

  const tiles: { icon: React.ReactNode; tone: Tone; label: string; to: string; show?: boolean }[] = [
    { icon: <ShoppingCart size={20} />, tone: "blue", label: "خرید سرویس", to: "/subscription" },
    { icon: <SlidersHorizontal size={20} />, tone: "violet", label: "سرویس سفارشی", to: "/custom-build", show: data?.custom_build_enabled !== false },
    { icon: <Gauge size={20} />, tone: "cyan", label: "PAYG", to: "/payg", show: !!data?.payg_enabled },
    { icon: <Gift size={20} />, tone: "pink", label: "تست رایگان", to: "/free-trial", show: !!data?.free_trial_available },
    { icon: <RefreshCw size={20} />, tone: "cyan", label: "تمدید", to: "/services", show: data?.renewal_enabled !== false },
    { icon: <WalletIcon size={20} />, tone: "gold", label: "کیف پول", to: "/wallet" },
    { icon: <Users size={20} />, tone: "green", label: "دعوت دوستان", to: "/referral", show: !user?.is_agent && user?.referral_enabled !== false },
    { icon: <Headphones size={20} />, tone: "info", label: "پشتیبانی", to: "/support" },
    { icon: <Ticket size={20} />, tone: "purple", label: "کد تخفیف", to: "/discount" },
  ]

  return (
    <div className="x-page">
      <div className="x-top">
        <Avatar name={name} size={46} me />
        <div className="x-grow">
          <div className="x-sub">خوش آمدید</div>
          <div className="x-h1 x-ellipsis">{name ? `سلام ${name}` : "سلام"}</div>
        </div>
        <button className="x-back" aria-label="پروفایل" onClick={() => nav("/profile")}><Crown size={18} /></button>
      </div>

      {err && <Alert tone="bad">دریافت اطلاعات انجام نشد. <Button size="sm" variant="ghost" onClick={load}>تلاش دوباره</Button></Alert>}

      {data && !data.orders_enabled && <Alert tone="warn">ثبت سفارش جدید موقتاً غیرفعال است. به‌محض فعال‌شدن اطلاع‌رسانی می‌شود.</Alert>}

      {/* wallet */}
      <Card hero style={{ minHeight: 132 }}>
        <div className="x-between">
          <div className="x-row-flex"><Tile icon={<WalletIcon size={19} />} tone="gold" /><span className="x-sub">موجودی کیف پول</span></div>
          <Button size="sm" variant="primary" icon={<Plus size={15} />} onClick={() => nav("/wallet")}>افزایش موجودی</Button>
        </div>
        <div style={{ marginTop: 14, minHeight: 36 }}>
          {data ? <div className="x-grad-text num" style={{ fontSize: 28, fontWeight: 700 }}>{toman(data.wallet)}</div> : <Skeleton width={190} height={34} />}
        </div>
        <div className="x-muted" style={{ marginTop: 6 }}>قابل استفاده برای خرید و تمدید</div>
      </Card>

      {/* services summary */}
      <Card tap onClick={() => nav("/services")} style={{ minHeight: 124 }}>
        {!data ? (
          <div className="x-row-flex" style={{ gap: 16 }}><Skeleton width={88} height={88} radius={44} /><div className="x-grow x-stack"><Skeleton height={16} width="60%" /><Skeleton height={12} /><Skeleton height={12} width="80%" /></div></div>
        ) : (
          <div className="x-row-flex" style={{ gap: 16 }}>
            <Ring value={pct} size={88} stroke={9}>
              <div><div className="num" style={{ fontSize: 17, fontWeight: 700 }}>{faDigits(pct)}٪</div><div className="x-muted">مصرف</div></div>
            </Ring>
            <div className="x-grow x-stack" style={{ gap: 6 }}>
              <div className="x-h3">سرویس‌های من</div>
              <div className="x-row-flex" style={{ gap: 6 }}>
                <Chip tone="ok">{num(sv!.active)} فعال</Chip>
                <Chip>{num(sv!.total)} کل</Chip>
              </div>
              <div className="x-sub num">{sv!.total_quota > 0 ? `${formatBytes(sv!.total_used)} از ${formatBytes(sv!.total_quota)}` : `${formatBytes(sv!.total_used)} مصرف شده`}</div>
            </div>
          </div>
        )}
      </Card>

      {data?.announcement && (
        <Card flat>
          <div className="x-row-flex" style={{ alignItems: "flex-start" }}>
            <Tile icon={<Megaphone size={18} />} tone="violet" />
            <div className="x-grow"><div className="x-h3">اطلاعیه</div><div className="x-sub" style={{ lineHeight: 1.9, marginTop: 2 }}>{data.announcement}</div></div>
          </div>
        </Card>
      )}

      {data && data.attention.length > 0 && (
        <Section title="نیازمند توجه">
          <Card pad0>
            <div className="x-list">
              {data.attention.map((a) => (
                <Row key={a.id} icon={a.kind === "expired" ? <AlertTriangle size={19} /> : <AlertTriangle size={19} />} tone={a.kind === "expired" ? "bad" : "warn"}
                  title={a.title}
                  sub={a.kind === "low_traffic" ? `${faDigits(Math.round(a.percent ?? 0))}٪ از حجم مصرف شده` : a.kind === "expired" ? "منقضی شده" : `${num(a.remaining_days ?? 0)} روز تا پایان`}
                  onClick={() => nav(`/services/${a.id}`)} />
              ))}
            </div>
          </Card>
        </Section>
      )}

      <Section title="دسترسی سریع">
        <div className="x-grid c4" style={{ gap: 8 }}>
          {tiles.filter((t) => t.show !== false).map((t) => (
            <button key={t.to + t.label} onClick={() => nav(t.to)} className="x-stat" style={{ alignItems: "center", gap: 8, padding: "12px 4px", minHeight: 88, textAlign: "center" }}>
              <Tile icon={t.icon} tone={t.tone} />
              <span style={{ fontSize: 11.5, fontWeight: 500, lineHeight: 1.4 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {(user?.is_admin || user?.is_reseller) && (
        <Card flat pad0>
          <div className="x-list">
            {user?.is_admin && <Row icon={<ShieldCheck size={19} />} tone="violet" title="پنل مدیریت" sub="مدیریت کاربران، سفارش‌ها و تنظیمات" onClick={() => nav("/admin")} />}
            {user?.is_reseller && <Row icon={<Store size={19} />} tone="cyan" title="پنل نماینده" sub="مشتریان، فروش و کیف پول" onClick={() => nav("/reseller")} />}
          </div>
        </Card>
      )}

      <Section title="فعالیت‌های اخیر">
        {!data ? <Skeleton height={120} radius={22} /> : data.activity.length === 0 ? (
          <Card flat><Empty title="فعالیتی ثبت نشده" sub="خرید و شارژ شما اینجا نمایش داده می‌شود" icon={<Activity size={30} strokeWidth={1.5} />} /></Card>
        ) : (
          <Card pad0>
            <div className="x-list">
              {data.activity.slice(0, 5).map((a, i) => {
                const m = ACT_ICON[a.type] ?? { icon: <Server size={17} />, tone: "info" as Tone }
                const tm = a.amount != null ? txMeta(a as any) : null
                return <Row key={i} icon={tm ? tm.icon : m.icon} tone={tm ? tm.tone : m.tone} title={a.title} sub={`${timeAgo(a.at)} · ${jalaliDate(a.at)}`} chevron={false}
                  right={a.amount != null ? <TxAmount t={a as any} /> : undefined} />
              })}
            </div>
          </Card>
        )}
      </Section>
    </div>
  )
}
