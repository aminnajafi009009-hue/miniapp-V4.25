import { Settings, Package, Percent, Server, CreditCard, SlidersHorizontal, Megaphone, Handshake, ListOrdered, MessageSquare, FileClock, Wrench, UserCog, Globe2, Gift, BookOpen, Bell } from "lucide-react"
import { PageTop, List, Row, Section, type Tone } from "@/shared/ui/kit"
import { useAdminStore, type AdminSection } from "@/shared/api/admin"
import type { ReactNode } from "react"

interface Item { to: string; title: string; sub: string; icon: ReactNode; tone: Tone; section: AdminSection }
const GROUPS: { title: string; items: Item[] }[] = [
  { title: "عملیات", items: [
    { to: "/admin/queue", title: "صف درخواست‌ها", sub: "سفارش‌های در انتظار ارسال سرویس", icon: <ListOrdered size={19} />, tone: "warn", section: "requests" },
    { to: "/admin/orders", title: "سفارش‌ها", sub: "فهرست و پیگیری سفارش‌ها", icon: <ListOrdered size={19} />, tone: "blue", section: "requests" },
    { to: "/admin/tickets", title: "تیکت‌ها", sub: "پاسخ به پیام‌های کاربران", icon: <MessageSquare size={19} />, tone: "pink", section: "tickets" },
    { to: "/admin/broadcast", title: "پیام همگانی", sub: "ارسال به گروه‌های مختلف", icon: <Megaphone size={19} />, tone: "violet", section: "broadcast" },
    { to: "/admin/agents", title: "نمایندگان", sub: "مدیریت و درصد تخفیف", icon: <Handshake size={19} />, tone: "gold", section: "agency" },
  ] },
  { title: "فروشگاه", items: [
    { to: "/admin/catalog", title: "دسته‌ها و پلن‌ها", sub: "ساخت، ویرایش و فعال/غیرفعال", icon: <Package size={19} />, tone: "cyan", section: "plans" },
    { to: "/admin/services", title: "سفارشی و PAYG", sub: "قیمت و محدوده‌ی هر گزینه", icon: <SlidersHorizontal size={19} />, tone: "violet", section: "plans" },
    { to: "/admin/bot", title: "اطلاعات ربات و تمدید", sub: "اعلان صفحه‌ی اصلی، ری‌اکشن، کانال‌ها، تمدید", icon: <Settings size={19} />, tone: "info", section: "botinfo" },
    { to: "/admin/discounts", title: "کد تخفیف", sub: "ساخت و مدیریت کدها", icon: <Percent size={19} />, tone: "green", section: "discounts" },
    { to: "/admin/payments", title: "روش‌های پرداخت", sub: "کارت، کیف پول، ارز دیجیتال", icon: <CreditCard size={19} />, tone: "ok", section: "botinfo" },
    { to: "/admin/gateways", title: "درگاه‌ها و نام‌گذاری", sub: "یونیک‌پی، FrenzyEx، ترونادو، پیشوند و نام سرویس", icon: <Globe2 size={19} />, tone: "ok", section: "botinfo" },
    { to: "/admin/growth", title: "رفرال و کمپین‌ها", sub: "دعوت‌کننده‌ها و لینک‌های تبلیغاتی", icon: <Gift size={19} />, tone: "pink", section: "referrals" },
    { to: "/admin/notifs", title: "تنظیمات اعلان‌ها", sub: "روشن/خاموش اعلان‌ها و لاگ‌ها", icon: <Bell size={19} />, tone: "warn", section: "botinfo" },
    { to: "/admin/adv-reports", title: "گزارشات پیشرفته", sub: "گروه تاپیک‌دار گزارش‌ها و بک‌آپ هفتگی", icon: <Bell size={19} />, tone: "warn", section: "botinfo" },
    { to: "/admin/guides", title: "راهنماها", sub: "آموزش‌های کاربران", icon: <BookOpen size={19} />, tone: "cyan", section: "guides" },
  ] },
  { title: "سیستم", items: [
    { to: "/admin/panels", title: "پنل‌های VPN", sub: "وضعیت، سلامت و سرویس‌ها", icon: <Server size={19} />, tone: "purple", section: "vpn_panel" },
    { to: "/admin/fup", title: "مصرف منصفانه", sub: "حد آزاد و سهمیه‌ی روزانه‌ی نامحدودها", icon: <SlidersHorizontal size={19} />, tone: "warn", section: "vpn_panel" },
    { to: "/admin/manual-service", title: "ساخت سرویس دستی", sub: "ساخت روی پنل و تحویل به کاربر", icon: <Wrench size={19} />, tone: "green", section: "vpn_panel" },
    { to: "/admin/backup", title: "بک‌آپ", sub: "دریافت فوری و بک‌آپ خودکار", icon: <FileClock size={19} />, tone: "info", section: "botinfo" },
    { to: "/admin/logs", title: "لاگ و سلامت", sub: "خطاها و فعالیت ادمین‌ها", icon: <FileClock size={19} />, tone: "warn", section: "logs" },
  ] },
]
export default function AdminMore() {
  const can = useAdminStore((s) => s.can)
  const me = useAdminStore((s) => s.me)
  return (
    <div className="x-page">
      <PageTop title="همه‌ی بخش‌ها" sub={me?.is_main ? "مدیر اصلی — دسترسی کامل" : "دسترسی‌های شما"} back="/admin" />
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => can(i.section))
        if (!items.length) return null
        return (
          <Section key={g.title} title={g.title}>
            <List>{items.map((i) => <Row key={i.to} href={i.to} icon={i.icon} tone={i.tone} title={i.title} sub={i.sub} />)}</List>
          </Section>
        )
      })}
      <div className="x-muted" style={{ textAlign: "center", display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}><Wrench size={13} /><UserCog size={13} />دسترسی هر بخش توسط مدیر اصلی تعیین می‌شود.</div>
    </div>
  )
}
