import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Palette, Sun, Moon, MonitorSmartphone, Zap, Vibrate, BellRing, Hourglass, Wallet, Megaphone, RotateCcw, Wifi, AppWindow, X } from "lucide-react"
import WebApp from "@twa-dev/sdk"
import { Alert, Card, Chip, PageTop, Row, Section, Segmented, Switch, Tile } from "@/shared/ui/kit"
import { useUiStore, type Accent, type Fx, type Theme } from "@/shared/store/uiStore"
import { getSettings, saveSettings } from "@/shared/api/services"
import type { UserSettings } from "@/shared/api/types"
import { APPS } from "../Services/apps"
import { BASE_URL } from "@/shared/api/client"

const ACCENTS: { v: Accent; c: string; l: string }[] = [
  { v: "blue", c: "linear-gradient(135deg,#6c8cff,#35d6c0)", l: "آبی" },
  { v: "violet", c: "linear-gradient(135deg,#9b7bff,#e07bff)", l: "بنفش" },
  { v: "aqua", c: "linear-gradient(135deg,#2fd0c4,#5fb3ff)", l: "فیروزه‌ای" },
  { v: "emerald", c: "linear-gradient(135deg,#3fd58f,#2fb8d8)", l: "زمردی" },
  { v: "rose", c: "linear-gradient(135deg,#ff6b9a,#ffa36b)", l: "صورتی" },
  { v: "amber", c: "linear-gradient(135deg,#f5b84a,#ff8a4a)", l: "کهربایی" },
]

type NotifKey = keyof UserSettings["notifications"]
const NOTIFS: { k: NotifKey; icon: React.ReactNode; t: string; s: string }[] = [
  { k: "usage_alerts", icon: <BellRing size={18} />, t: "هشدار مصرف حجم", s: "وقتی ۸۰٪ و ۹۰٪ حجم مصرف شد" },
  { k: "expiry_alerts", icon: <Hourglass size={18} />, t: "یادآوری پایان سرویس", s: "دو روز مانده به پایان و هنگام اتمام" },
  { k: "wallet_alerts", icon: <Wallet size={18} />, t: "اعلان کیف پول", s: "شارژ، هدیه و تأیید رسید" },
  { k: "promo", icon: <Megaphone size={18} />, t: "پیام‌های تبلیغاتی", s: "تخفیف‌ها، اطلاعیه‌ها و پیام همگانی" },
]

export default function SettingsPage() {
  const ui = useUiStore()
  const [s, setS] = useState<UserSettings | null>(null)
  const [failed, setFailed] = useState(false)
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => { getSettings().then(setS).catch(() => setFailed(true)) }, [])
  useEffect(() => {
    let live = true
    fetch(`${BASE_URL}/api/role`, { method: "OPTIONS" }).then(() => live && setOnline(true)).catch(() => live && setOnline(false))
    return () => { live = false }
  }, [])

  const toggle = async (k: NotifKey, v: boolean) => {
    if (!s) return
    const prev = s
    setS({ ...s, notifications: { ...s.notifications, [k]: v } })
    try { setS(await saveSettings({ notifications: { [k]: v } })) } catch { setS(prev); toast.error("ذخیره‌ی تنظیمات ناموفق بود") }
  }
  const setApp = async (id: string | null) => {
    if (!s) return
    const prev = s
    setS({ ...s, default_app: id })
    try { setS(await saveSettings({ default_app: id })); toast.success(id ? "برنامه‌ی پیش‌فرض ذخیره شد" : "برنامه‌ی پیش‌فرض حذف شد") } catch { setS(prev); toast.error("ذخیره ناموفق بود") }
  }

  return (
    <div className="x-page">
      <PageTop title="تنظیمات" sub="شخصی‌سازی ظاهر، اعلان‌ها و برنامه‌ی اتصال" back="/profile" />

      <Section title="ظاهر">
        <Card>
          <div className="x-stack" style={{ gap: 16 }}>
            <div className="x-stack" style={{ gap: 8 }}>
              <div className="x-row-flex x-label"><Sun size={15} />حالت نمایش</div>
              <Segmented<Theme> value={ui.theme} onChange={(v) => ui.set({ theme: v })} options={[
                { value: "auto", label: <span className="x-row-flex" style={{ gap: 5, justifyContent: "center" }}><MonitorSmartphone size={14} />خودکار</span> },
                { value: "dark", label: <span className="x-row-flex" style={{ gap: 5, justifyContent: "center" }}><Moon size={14} />تیره</span> },
                { value: "light", label: <span className="x-row-flex" style={{ gap: 5, justifyContent: "center" }}><Sun size={14} />روشن</span> },
              ]} />
            </div>
            <div className="x-stack" style={{ gap: 8 }}>
              <div className="x-row-flex x-label"><Palette size={15} />رنگ اصلی</div>
              <div className="x-wrap" style={{ gap: 12 }}>
                {ACCENTS.map((a) => (
                  <button key={a.v} aria-label={a.l} title={a.l} onClick={() => ui.set({ accent: a.v })}
                    style={{ width: 40, height: 40, borderRadius: 14, background: a.c, outline: ui.accent === a.v ? "2px solid var(--text)" : "2px solid transparent", outlineOffset: 3, transition: "outline-color .15s" }} />
                ))}
              </div>
            </div>
            <div className="x-between">
              <div className="x-row-flex"><Tile icon={<Zap size={17} />} tone="gold" size="sm" /><div><div style={{ fontWeight: 500 }}>حالت سبک (سرعت بیشتر)</div><div className="x-muted">حذف شیشه‌ای‌سازی و سایه‌های سنگین برای گوشی‌های ضعیف</div></div></div>
              <Switch checked={ui.fx === "lite"} onChange={(v) => ui.set({ fx: (v ? "lite" : "full") as Fx })} label="حالت سبک" />
            </div>
            <div className="x-between">
              <div className="x-row-flex"><Tile icon={<Vibrate size={17} />} tone="violet" size="sm" /><div><div style={{ fontWeight: 500 }}>لرزش لمسی</div><div className="x-muted">بازخورد هنگام زدن دکمه‌ها</div></div></div>
              <Switch checked={ui.haptics} onChange={(v) => ui.set({ haptics: v })} label="لرزش" />
            </div>
          </div>
        </Card>
      </Section>

      <Section title="اعلان‌های ربات">
        <Card pad0>
          {failed ? <div style={{ padding: 14 }}><Alert tone="warn">دریافت تنظیمات اعلان ممکن نشد.</Alert></div> : (
            <div className="x-list">
              {NOTIFS.map((n) => (
                <div key={n.k} className="x-item">
                  <Tile icon={n.icon} tone="blue" />
                  <div className="x-grow"><div className="t">{n.t}</div><div className="s">{n.s}</div></div>
                  <Switch checked={s ? s.notifications[n.k] : true} disabled={!s} onChange={(v) => toggle(n.k, v)} label={n.t} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </Section>

      <Section title="برنامه‌ی پیش‌فرض اتصال" action={s?.default_app ? <button className="x-row-flex x-muted" onClick={() => setApp(null)}><X size={13} />حذف</button> : undefined}>
        <Card>
          <div className="x-stack" style={{ gap: 10 }}>
            <div className="x-muted">برنامه‌ی انتخابی در صفحه‌ی هر سرویس اول نمایش داده می‌شود.</div>
            <div className="x-wrap">
              {APPS.map((a) => <Chip key={a.id} on={s?.default_app === a.id} icon={<AppWindow size={13} />} onClick={() => setApp(a.id)}>{a.name}</Chip>)}
            </div>
          </div>
        </Card>
      </Section>

      <Section title="سیستم">
        <Card pad0>
          <div className="x-list">
            <Row icon={<Wifi size={18} />} tone={online === false ? "bad" : "ok"} title="اتصال به سرور" sub={online === null ? "در حال بررسی…" : online ? "برقرار" : "قطع است"} chevron={false} />
            <Row icon={<RotateCcw size={18} />} tone="warn" title="بازنشانی ظاهر" sub="برگرداندن رنگ، حالت نمایش و لرزش به پیش‌فرض" onClick={() => { ui.reset(); toast.success("ظاهر به حالت پیش‌فرض برگشت") }} />
            <Row icon={<RotateCcw size={18} />} tone="info" title="پاک‌سازی حافظه‌ی محلی و بارگذاری مجدد" sub="در صورت نمایش اطلاعات قدیمی" onClick={() => { try { localStorage.clear(); sessionStorage.clear() } catch { /* ignore */ } location.reload() }} />
            <Row icon={<X size={18} />} tone="bad" title="بستن برنامه" onClick={() => { try { WebApp.close() } catch { window.close() } }} />
          </div>
        </Card>
      </Section>
    </div>
  )
}
