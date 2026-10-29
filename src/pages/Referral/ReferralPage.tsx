import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Copy, Gift, Share2, Users, UserCheck, Unlock, Lock, Info, KeyRound } from "lucide-react"
import WebApp from "@twa-dev/sdk"
import { Alert, Button, Card, KV, PageTop, Skeleton, Stat, Tile } from "@/shared/ui/kit"
import { getReferral } from "@/shared/api/services"
import type { ReferralStats } from "@/shared/api/types"
import { hapticImpact } from "@/shared/haptics"
import { copyText, num, toman } from "@/shared/lib/format"

function ruleShort(d: ReferralStats): string {
  if (d.rule === "any") return "بدون هیچ شرط خریدی؛ به‌محض عضویت دوستتان"
  if (d.rule === "paid") return "به شرط اولین خرید پولی دوستتان"
  return `به شرط خرید حداقل ${num(d.min_purchase_gb)} گیگ توسط دوستتان`
}
function ruleLong(d: ReferralStats): string {
  if (d.rule === "any") return "پاداش به‌محض ورود دوست دعوت‌شده به‌صورت خودکار به کیف پول شما اضافه می‌شود. تست رایگان هم شامل این پاداش است."
  if (d.rule === "paid") return "پاداش پس از اولین خرید پولی دوست دعوت‌شده به‌صورت خودکار به کیف پول شما اضافه می‌شود. تست رایگان پاداش را آزاد نمی‌کند."
  return `پاداش پس از اولین خرید حداقل ${num(d.min_purchase_gb)} گیگ دوست دعوت‌شده به‌صورت خودکار به کیف پول شما اضافه می‌شود. تست رایگان و خریدهای کمتر از این مقدار پاداش را آزاد نمی‌کنند.`
}

export default function ReferralPage() {
  const [d, setD] = useState<ReferralStats | null>(null)
  const [err, setErr] = useState(false)
  const load = () => { setErr(false); getReferral().then(setD).catch(() => setErr(true)) }
  useEffect(load, [])

  const copyLink = async () => {
    if (!d) return
    hapticImpact("light")
    ;(await copyText(d.invite_link)) ? toast.success("لینک دعوت کپی شد") : toast.error("کپی خودکار انجام نشد")
  }
  const share = () => {
    if (!d) return
    hapticImpact("medium")
    const text = "با این لینک عضو شو و تست رایگان بگیر"
    try { WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(d.invite_link)}&text=${encodeURIComponent(text)}`) }
    catch { if (navigator.share) navigator.share({ url: d.invite_link, text }).catch(() => undefined); else void copyLink() }
  }

  return (
    <div className="x-page">
      <PageTop title="دعوت دوستان" sub="با هر دعوت موفق پاداش نقدی بگیرید" back="/profile" />
      {err && <><Alert tone="bad">دریافت اطلاعات دعوت ناموفق بود.</Alert><Button onClick={load}>تلاش دوباره</Button></>}
      {!d && !err ? <><Skeleton height={150} radius={26} /><Skeleton height={64} radius={18} /><Skeleton height={90} radius={18} /></> : d && (
        <>
          <Card hero>
            <div className="x-stack" style={{ gap: 10, alignItems: "center", textAlign: "center" }}>
              <Tile icon={<Gift size={24} />} size="lg" solid />
              <div className="x-h2">به‌ازای هر دعوت موفق <span className="x-grad-text">{toman(d.reward_amount)}</span></div>
              <div className="x-sub">{ruleShort(d)}</div>
            </div>
          </Card>

          <Card>
            <div className="x-stack" style={{ gap: 10 }}>
              <div className="x-row-flex x-label"><KeyRound size={15} />کد اختصاصی شما</div>
              <div className="x-row-flex">
                <code className="x-code x-grow" style={{ textAlign: "center", fontSize: 15, letterSpacing: 1 }}>{d.invite_code}</code>
                <Button iconOnly aria-label="کپی لینک" onClick={copyLink}><Copy size={17} /></Button>
              </div>
              <Button variant="primary" size="lg" full icon={<Share2 size={18} />} onClick={share}>اشتراک‌گذاری لینک دعوت</Button>
            </div>
          </Card>

          <div className="x-grid c2">
            <Stat icon={<Users size={16} />} tone="blue" label="تعداد دعوت" value={num(d.invited_count)} />
            <Stat icon={<UserCheck size={16} />} tone="ok" label="دعوت موفق" value={num(d.successful_invites)} />
          </div>

          <Card>
            <KV k={<span className="x-row-flex" style={{ gap: 6 }}><Unlock size={14} />مبلغ آزادشده</span>} v={<b style={{ color: "var(--ok)" }}>{toman(d.released_amount)}</b>} />
            {d.locked_wallet > 0 && <KV k={<span className="x-row-flex" style={{ gap: 6 }}><Lock size={14} />مبلغ در انتظار</span>} v={toman(d.locked_wallet)} />}
          </Card>

          <div className="x-alert"><Info size={18} style={{ flex: "none", marginTop: 3 }} /><div>{ruleLong(d)}</div></div>
          {d.channel_leave_lock && <div className="x-alert warn"><Lock size={18} style={{ flex: "none", marginTop: 3 }} /><div>اگر دوست دعوت‌شده از کانال‌های اجباری خارج شود، پاداش مربوط به او دوباره قفل می‌شود.</div></div>}
          {d.penalty_enabled && (d.penalty_wallet_amount || d.penalty_service_gb) ? <div className="x-alert bad"><Info size={18} style={{ flex: "none", marginTop: 3 }} /><div>در صورت خروج فرد دعوت‌شده از کانال‌ها، جریمه اعمال می‌شود{d.penalty_wallet_amount ? `: ${toman(d.penalty_wallet_amount)} از کیف پول` : ""}{d.penalty_wallet_amount && d.penalty_service_gb ? " و" : ""}{d.penalty_service_gb ? ` ${num(d.penalty_service_gb)} گیگ از سرویس` : ""}.</div></div> : null}
        </>
      )}
    </div>
  )
}
