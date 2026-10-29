import { NavLink } from "react-router-dom"
import { House, Wallet, ShieldCheck, ShoppingBag, UserRound, type LucideIcon } from "lucide-react"
import { hapticSelect } from "@/shared/haptics"

export interface NavItem { title: string; icon: LucideIcon; path: string; end?: boolean }
export const USER_NAV: NavItem[] = [
  { title: "خانه", icon: House, path: "/", end: true },
  { title: "سرویس‌ها", icon: ShieldCheck, path: "/services" },
  { title: "خرید", icon: ShoppingBag, path: "/subscription" },
  { title: "کیف پول", icon: Wallet, path: "/wallet" },
  { title: "پروفایل", icon: UserRound, path: "/profile" },
]

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="x-nav" aria-label="ناوبری">
      {items.map((it) => {
        const Icon = it.icon
        return (
          <NavLink key={it.path} to={it.path} end={it.end} onClick={hapticSelect} className={({ isActive }) => (isActive ? "on" : "")}>
            <Icon size={21} strokeWidth={2} />
            <span>{it.title}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
export default function PremiumBottomNavigation() { return <BottomNav items={USER_NAV} /> }
