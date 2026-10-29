import { useEffect, useState } from "react"
import { Wallet, ShoppingBag, ShieldCheck, Users, Settings, Gift, Headphones, Ticket, Crown, Store, Award } from "lucide-react"
import { Alert, Avatar, Bar, Button, Card, List, Row, Section, Skeleton, Stat } from "@/shared/ui/kit"
import { getProfile, getMe } from "@/shared/api/services"
import type { ProfileData } from "@/shared/api/types"
import { useUserStore } from "@/shared/store/userStore"
import { jalaliDate, num, toman } from "@/shared/lib/format"

async function load(): Promise<ProfileData> {
  try { return await getProfile() } catch {
    const m = await getMe()
    return { name: m.name, username: null, telegram_id: m.telegram_id, joined: m.joined, wallet: m.wallet, locked_wallet: m.locked_wallet, total_purchase: m.total_purchase,
      orders_count: 0, services_count: m.services_count, invited_count: m.invited_count, successful_invites: m.successful_invites, rank: null, agent_percent: m.agent_discount_percent || 0 }
  }
}

export default function ProfilePage() {
  const user = useUserStore((s) => s.user)
  const [p, setP] = useState<ProfileData | null>(null)
  const [err, setErr] = useState(false)
  const run = () => { setErr(false); load().then(setP).catch(() => setErr(true)) }
  useEffect(run, [])

  return (
    <div className="x-page">
      {err && <><Alert tone="bad">دریافت اطلاعات پروفایل ناموفق بود.</Alert><Button onClick={run}>تلاش دوباره</Button></>}

      <Card hero style={{ minHeight: 150 }}>
        {!p ? <Skeleton height={110} radius={20} /> : (
          <div className="x-stack" style={{ gap: 14 }}>
            <div className="x-row-flex" style={{ gap: 14 }}>
              <Avatar name={p.name} src={p.photo_url} size={62} me />
              <div className="x-grow">
                <div className="x-h1 x-ellipsis">{p.name}</div>
                <div className="x-sub ltr x-ellipsis">{p.username ? `@${p.username}` : `ID ${p.telegram_id}`}</div>
                <div className="x-muted">عضویت از {jalaliDate(p.joined)}</div>
              </div>
            </div>
            {p.rank && (
              <div className="x-stack" style={{ gap: 6 }}>
                <div className="x-between">
                  <span className="x-row-flex" style={{ gap: 6, fontWeight: 700 }}><Award size={16} style={{ color: "var(--accent)" }} />سطح {p.rank.name}</span>
                  <span className="x-muted">{p.rank.next_at ? `تا سطح بعد: ${toman(Math.max(0, p.rank.next_at - p.total_purchase))}` : "بالاترین سطح"}</span>
                </div>
                <Bar value={p.rank.progress} />
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="x-grid c2">
        {!p ? [0, 1, 2, 3].map((i) => <Skeleton key={i} height={84} radius={16} />) : <>
          <Stat icon={<Wallet size={16} />} tone="gold" label="موجودی کیف پول" value={<span style={{ fontSize: 15 }}>{toman(p.wallet)}</span>} />
          <Stat icon={<ShoppingBag size={16} />} tone="blue" label="مجموع خرید" value={<span style={{ fontSize: 15 }}>{toman(p.total_purchase)}</span>} />
          <Stat icon={<ShieldCheck size={16} />} tone="green" label="سرویس‌ها" value={num(p.services_count)} sub={p.orders_count ? `${num(p.orders_count)} سفارش` : undefined} />
          {(p as any).referral_enabled !== false && <Stat icon={<Users size={16} />} tone="pink" label="دعوت‌ها" value={`${num(p.successful_invites)} / ${num(p.invited_count)}`} sub="موفق / کل" />}
        </>}
      </div>

      {p && p.agent_percent > 0 && (
        <Card flat><div className="x-row-flex"><span className="x-tile t-gold"><Crown size={18} /></span><div className="x-grow"><div className="x-h3">حساب نماینده</div><div className="x-sub">{num(p.agent_percent)}٪ تخفیف اختصاصی روی خریدها</div></div></div></Card>
      )}

      <Section title="دسترسی‌ها">
        <List>
          <Row icon={<Wallet size={19} />} tone="gold" title="کیف پول" sub="شارژ و تاریخچه تراکنش‌ها" href="/wallet" />
          {!(p && ((p as any).is_agent || (p as any).referral_enabled === false)) && <Row icon={<Gift size={19} />} tone="pink" title="دعوت دوستان" sub="پاداش نقدی برای هر دعوت موفق" href="/referral" />}
          <Row icon={<Ticket size={19} />} tone="purple" title="کد تخفیف" sub="بررسی اعتبار کد" href="/discount" />
          <Row icon={<Headphones size={19} />} tone="info" title="پشتیبانی" sub="ارسال تیکت و کانال‌ها" href="/support" />
          <Row icon={<Settings size={19} />} tone="blue" title="تنظیمات" sub="ظاهر، اعلان‌ها و برنامه‌ی پیش‌فرض" href="/settings" />
        </List>
      </Section>

      {(user?.is_admin || user?.is_reseller) && (
        <Section title="مدیریت">
          <List>
            {user?.is_admin && <Row icon={<ShieldCheck size={19} />} tone="violet" title="پنل مدیریت" sub="کاربران، سفارش‌ها و تنظیمات" href="/admin" />}
            {user?.is_reseller && <Row icon={<Store size={19} />} tone="cyan" title="پنل نماینده" sub="فروش، مشتریان و کیف پول" href="/reseller" />}
          </List>
        </Section>
      )}
    </div>
  )
}
