import { Suspense, useEffect } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Users, ReceiptText, BarChart3, Grid2x2, Store, Wallet, TrendingUp, ArrowLeftRight, Server } from "lucide-react"
import { BottomNav, type NavItem } from "@/shared/ui/PremiumBottomNavigation/PremiumBottomNavigation"
import { Logo, PageSkeleton, Empty } from "@/shared/ui/kit"
import { useAdminStore, type AdminSection } from "@/shared/api/admin"
import { useUserStore } from "@/shared/store/userStore"

export const ADMIN_NAV: NavItem[] = [
  { title: "داشبورد", icon: LayoutDashboard, path: "/admin", end: true },
  { title: "کاربران", icon: Users, path: "/admin/users" },
  { title: "رسیدها", icon: ReceiptText, path: "/admin/receipts" },
  { title: "گزارش‌ها", icon: BarChart3, path: "/admin/reports" },
  { title: "بیشتر", icon: Grid2x2, path: "/admin/more" },
]
export const RESELLER_NAV: NavItem[] = [
  { title: "داشبورد", icon: LayoutDashboard, path: "/reseller", end: true },
  { title: "فروش", icon: TrendingUp, path: "/reseller/sales" },
  { title: "سرویس‌ها", icon: Server, path: "/reseller/services" },
  { title: "پلن‌ها", icon: Store, path: "/reseller/plans" },
  { title: "کیف پول", icon: Wallet, path: "/reseller/wallet" },
]

function Top({ title }: { title: string }) {
  return (
    <div className="x-top" style={{ marginBottom: 14 }}>
      <Logo />
      <div className="x-grow"><div className="x-h2">{title}</div></div>
      <Link to="/" className="x-chip" style={{ height: 32 }}><ArrowLeftRight size={14} />نمای کاربر</Link>
    </div>
  )
}

export function AdminLayout() {
  const loadMe = useAdminStore((s) => s.load)
  const fetchUser = useUserStore((s) => s.fetchUser)
  const user = useUserStore((s) => s.user)
  const loc = useLocation()
  useEffect(() => { void fetchUser(); void loadMe() }, [fetchUser, loadMe])
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  if (user && !user.is_admin) return <main className="x-shell no-nav"><Empty title="دسترسی غیرمجاز" sub="این حساب دسترسی ادمین ندارد." /></main>
  return (
    <>
      <main className="x-shell">
        <Top title="پنل مدیریت" />
        <Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>
      </main>
      <BottomNav items={ADMIN_NAV} />
    </>
  )
}

export function ResellerLayout() {
  const fetchUser = useUserStore((s) => s.fetchUser)
  const user = useUserStore((s) => s.user)
  const loc = useLocation()
  useEffect(() => { void fetchUser() }, [fetchUser])
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  if (user && !user.is_reseller) return <main className="x-shell no-nav"><Empty title="دسترسی غیرمجاز" sub="این حساب نماینده نیست." /></main>
  return (
    <>
      <main className="x-shell">
        <Top title="پنل نمایندگی" />
        <Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>
      </main>
      <BottomNav items={RESELLER_NAV} />
    </>
  )
}

/** Wrap an admin page so it renders only if the admin holds the permission. */
export function Need({ section, children }: { section: AdminSection; children: React.ReactNode }) {
  const me = useAdminStore((s) => s.me)
  const failed = useAdminStore((s) => s.failed)
  const load = useAdminStore((s) => s.load)
  if (!me && failed) return <Empty title="خطا در دریافت دسترسی‌ها" sub="اتصال به سرور برقرار نشد." action={<button className="x-btn" onClick={() => void load()}>تلاش مجدد</button>} />
  if (!me) return <PageSkeleton />
  if (!(me.is_main || me.sections.includes(section))) return <Empty title="دسترسی ندارید" sub="مدیر اصلی این بخش را برای شما فعال نکرده است." />
  return <>{children}</>
}
