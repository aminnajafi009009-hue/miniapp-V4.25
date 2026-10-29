import { ShoppingBag, Gift, ShieldCheck, Users, Headset, Trophy, Percent, Settings, UserRound } from "lucide-react"
interface P { size?: number; active?: boolean; glow?: boolean }
const wrap = (I: any) => function Icon({ size = 44 }: P) {
  return <span className="x-tile solid" style={{ width: size, height: size, borderRadius: size * 0.3 }}><I size={size * 0.5} /></span>
}
export const CartIcon = wrap(ShoppingBag)
export const GiftIcon = wrap(Gift)
export const ShieldSearchIcon = wrap(ShieldCheck)
export const UsersIcon = wrap(Users)
export const HeadsetIcon = wrap(Headset)
export const TrophyIcon = wrap(Trophy)
export const PercentIcon = wrap(Percent)
export const GearIcon = wrap(Settings)
export const ProfileIcon = wrap(UserRound)
