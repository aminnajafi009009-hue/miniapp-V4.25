import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  Activity, AppWindow, CalendarClock, Check, Copy, Download, FileText, KeyRound, Link2, Monitor, Power, QrCode,
  RefreshCw, RotateCcw, Server, Smartphone, Trash2, Wifi, Cpu, Globe, Clock, ChevronLeft,
} from "lucide-react"
import { Alert, BarChart, Button, Card, Chip, Empty, KV, PageSkeleton, PageTop, Ring, Section, Segmented, Sheet, Skeleton, Stat, Tile } from "@/shared/ui/kit"
import {
  deleteService, getServiceConfigs, getServiceDetail, getServiceQrBlob, getServiceUsageHistory, getSettings,
  revokeServiceLink, toggleServiceLink,
} from "@/shared/api/services"
import type { ServiceDetail, UsageHistory } from "@/shared/api/types"
import { copyText, faDigits, formatBytes, jalaliDate, num, timeAgo } from "@/shared/lib/format"
import { hapticNotification } from "@/shared/haptics"
import { PLATFORMS, appsFor, detectPlatform, launchLink, openExternal, rememberPlatform, type Platform, type VpnApp } from "./apps"
import { daysLabel, statusMeta } from "./status"

/* ---------- hero ---------- */
function Hero({ d }: { d: ServiceDetail }) {
  const st = statusMeta(d.status)
  const total = d.usage.total
  const unlimited = total === 0 || !!d.unlimited_volume
  const pct = unlimited ? 0 : d.usage.percent
  return (
    <Card hero>
      <div className="x-stack" style={{ gap: 14 }}>
        <div className="x-between" style={{ alignItems: "flex-start" }}>
          <div className="x-grow">
            <div className="x-h2" style={{ lineHeight: 1.5, wordBreak: "break-word" }}>{d.title}</div>
            <div className="x-muted">{d.panel_name || "سرویس"}{d.created_at ? ` · ساخته‌شده ${jalaliDate(d.created_at)}` : ""}</div>
          </div>
          <Chip tone={st.tone}>{st.label}</Chip>
        </div>
        <div className="x-row-flex" style={{ gap: 16 }}>
          <Ring value={pct} size={104} stroke={10}>
            <div>
              <div className="x-h2 num">{unlimited ? "∞" : total == null ? "—" : `${faDigits(pct ?? 0)}٪`}</div>
              <div className="x-muted">مصرف</div>
            </div>
          </Ring>
          <div className="x-grow x-stack" style={{ gap: 6 }}>
            <KV k="مصرف‌شده" v={<span className="num">{formatBytes(d.usage.used)}</span>} />
            <KV k="حجم کل" v={<span className="num">{unlimited ? "نامحدود" : total == null ? "—" : formatBytes(total)}</span>} />
            <KV k="باقی‌مانده" v={<span className="num">{unlimited ? "نامحدود" : formatBytes(d.usage.remaining)}</span>} />
          </div>
        </div>
        <div className="x-grid c2">
          <Stat icon={<CalendarClock size={16} />} tone="blue" label="زمان باقی‌مانده" value={d.unlimited_time ? "نامحدود" : daysLabel(d.remaining_days)} />
          <Stat icon={<Clock size={16} />} tone="violet" label="تاریخ پایان" value={<span style={{ fontSize: 14 }}>{d.expire_ts ? jalaliDate(d.expire_ts) : d.expiry ? jalaliDate(d.expiry) : "نامحدود"}</span>} />
        </div>
        {(d.usage.upload != null || d.usage.download != null) && (
          <div className="x-grid c2">
            <Stat label="دانلود" value={formatBytes(d.usage.download)} />
            <Stat label="آپلود" value={formatBytes(d.usage.upload)} />
          </div>
        )}
      </div>
    </Card>
  )
}

/* ---------- connection ---------- */
function Connection({ d }: { d: ServiceDetail }) {
  const c = d.connection
  const rows: { icon: React.ReactNode; k: string; v: React.ReactNode }[] = []
  if (c.online_at) rows.push({ icon: <Wifi size={16} />, k: "آخرین اتصال", v: <span className="x-row-flex" style={{ gap: 6 }}><i className={`x-dot ${c.is_online ? "ok" : ""}`} />{c.is_online ? "آنلاین" : timeAgo(c.online_at)}</span> })
  if (c.app) rows.push({ icon: <AppWindow size={16} />, k: "برنامه‌ی متصل", v: `${c.app.name}${c.app.version ? ` ${faDigits(c.app.version)}` : ""}` })
  if (c.app?.platform) rows.push({ icon: <Cpu size={16} />, k: "سیستم‌عامل", v: c.app.platform })
  if (c.app?.device) rows.push({ icon: <Smartphone size={16} />, k: "دستگاه", v: <span className="ltr">{c.app.device}</span> })
  if (c.ip) rows.push({ icon: <Globe size={16} />, k: "آخرین IP", v: <span className="mono">{c.ip}</span> })
  if (c.last_sub_fetch_at) rows.push({ icon: <RefreshCw size={16} />, k: "آخرین دریافت ساب", v: timeAgo(c.last_sub_fetch_at) })
  if (c.devices_limit != null) rows.push({ icon: <Monitor size={16} />, k: "محدودیت دستگاه", v: `${num(c.devices.length)} از ${num(c.devices_limit)}` })
  return (
    <Section title="اتصال و دستگاه">
      <Card>
        {rows.length === 0 ? (
          <div className="x-muted" style={{ textAlign: "center", padding: "8px 0" }}>هنوز اطلاعاتی از اتصال ثبت نشده است؛ بعد از اولین اتصال این بخش پر می‌شود.</div>
        ) : rows.map((r, i) => (
          <div key={i} className="x-kv" style={{ alignItems: "center" }}>
            <span className="k x-row-flex" style={{ gap: 8 }}>{r.icon}{r.k}</span>
            <span className="v">{r.v}</span>
          </div>
        ))}
        {c.devices.length > 0 && (
          <div className="x-stack" style={{ marginTop: 8, gap: 6 }}>
            {c.devices.map((dv, i) => (
              <div key={i} className="x-between x-sub" style={{ padding: "8px 10px", borderRadius: 12, background: "var(--s1)" }}>
                <span className="x-row-flex" style={{ gap: 8 }}><Smartphone size={14} />{dv.name}</span>
                <span className="x-muted">{dv.platform || ""}{dv.last_seen ? ` · ${timeAgo(dv.last_seen)}` : ""}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Section>
  )
}

/* ---------- usage chart ---------- */
function UsageChart({ id }: { id: number }) {
  const [days, setDays] = useState<7 | 14 | 30>(14)
  const [h, setH] = useState<UsageHistory | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    setFailed(false)
    getServiceUsageHistory(id, days).then((r) => live && setH(r)).catch(() => live && setFailed(true))
    return () => { live = false }
  }, [id, days])
  const data = useMemo(() => (h?.points || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).map((p) => ({ label: jalaliDate(p.date).slice(5), value: p.used })), [h])
  return (
    <Section title="نمودار مصرف" action={<div style={{ width: 150 }}><Segmented<number> value={days} onChange={(v) => setDays(v as 7 | 14 | 30)} options={[{ value: 7, label: "۷ روز" }, { value: 14, label: "۱۴" }, { value: 30, label: "۳۰" }]} /></div>}>
      <Card>
        {failed ? <div className="x-muted" style={{ textAlign: "center", padding: 18 }}>دریافت نمودار ممکن نشد.</div>
          : !h ? <Skeleton height={150} radius={14} />
          : !h.has_data ? (
            <div className="x-stack" style={{ alignItems: "center", textAlign: "center", padding: "14px 6px", gap: 6 }}>
              <Tile icon={<Activity size={19} />} tone="blue" />
              <div className="x-sub">داده‌ی نمودار با گذر زمان جمع می‌شود</div>
              <div className="x-muted">از امروز مصرف روزانه ثبت می‌شود و فردا نمودار کامل‌تر خواهد بود.</div>
            </div>
          ) : (
            <div className="x-stack" style={{ gap: 12 }}>
              <BarChart data={data} height={140} format={(v) => formatBytes(v)} />
              <div className="x-grid c3">
                <Stat label="جمع دوره" value={<span style={{ fontSize: 14 }}>{formatBytes(h.total_period)}</span>} />
                <Stat label="میانگین روزانه" value={<span style={{ fontSize: 14 }}>{formatBytes(h.avg_per_day)}</span>} />
                <Stat label="بیشترین روز" value={<span style={{ fontSize: 14 }}>{h.peak ? formatBytes(h.peak.used) : "—"}</span>} sub={h.peak ? jalaliDate(h.peak.date).slice(5) : undefined} />
              </div>
            </div>
          )}
      </Card>
    </Section>
  )
}

/* ---------- open in app ---------- */
function OpenInApp({ d, defaultApp, title }: { d: ServiceDetail; defaultApp: string | null; title: string }) {
  const [platform, setPlatform] = useState<Platform>(detectPlatform())
  const link = d.sub_link
  const list = useMemo(() => appsFor(platform, defaultApp), [platform, defaultApp])
  const featured = list.filter((a) => a.featured || a.id === defaultApp)
  const others = list.filter((a) => !featured.includes(a))
  const open = (a: VpnApp) => {
    if (!link) return
    hapticNotification("success")
    launchLink(a.build(link, title))
  }
  const dl = (a: VpnApp) => { const u = a.store[platform]; if (u) openExternal(u) }
  return (
    <Section title="افزودن به برنامه">
      <Card>
        <div className="x-stack" style={{ gap: 12 }}>
          <Segmented value={platform} onChange={(p) => { setPlatform(p); rememberPlatform(p) }} options={PLATFORMS.map((p) => ({ value: p.value, label: p.label }))} />
          {!link ? <Alert tone="warn">لینک اشتراک این سرویس در دسترس نیست.</Alert>
            : d.link_disabled ? <Alert tone="warn">لینک این سرویس غیرفعال است؛ ابتدا آن را فعال کنید.</Alert> : null}
          <div className="x-stack" style={{ gap: 8 }}>
            {featured.map((a) => (
              <div key={a.id} className="x-row-flex" style={{ gap: 8 }}>
                <button className="x-btn primary lg x-grow" disabled={!link || !!d.link_disabled} onClick={() => open(a)} style={{ justifyContent: "space-between" }}>
                  <span className="x-row-flex" style={{ gap: 10 }}>
                    <span className="x-tile sm" style={{ background: "rgba(255,255,255,.22)", border: 0, color: "inherit", fontWeight: 700 }}>{a.name.slice(0, 1)}</span>
                    {a.name}{a.id === defaultApp && <span style={{ fontSize: 11, opacity: .8 }}>پیش‌فرض</span>}
                  </span>
                  <span style={{ fontSize: 12, opacity: .85 }}>افزودن خودکار</span>
                </button>
                <Button iconOnly aria-label={`دانلود ${a.name}`} onClick={() => dl(a)} disabled={!a.store[platform]}><Download size={17} /></Button>
              </div>
            ))}
          </div>
          {others.length > 0 && (
            <div className="x-grid c2">
              {others.map((a) => (
                <div key={a.id} className="x-card flat" style={{ padding: 10 }}>
                  <div className="x-row-flex" style={{ gap: 8 }}>
                    <Tile size="sm" tone={a.tone} icon={<span style={{ fontWeight: 700, fontSize: 13 }}>{a.name.slice(0, 1)}</span>} />
                    <div className="x-grow x-fulltext" style={{ fontWeight: 500 }}>{a.name}</div>
                  </div>
                  <div className="x-row-flex" style={{ gap: 6, marginTop: 8 }}>
                    <Button size="sm" className="x-grow" disabled={!link || !!d.link_disabled} onClick={() => open(a)}>افزودن</Button>
                    <Button size="sm" iconOnly aria-label="دانلود" onClick={() => dl(a)} disabled={!a.store[platform]}><Download size={15} /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="x-muted">با زدن دکمه، برنامه باز می‌شود و اشتراک به‌صورت خودکار اضافه می‌شود. اگر برنامه نصب نیست ابتدا دانلود کنید.</div>
        </div>
      </Card>
    </Section>
  )
}

/* ---------- page ---------- */
export default function ServiceDetailPage() {
  const { id } = useParams()
  const sid = Number(id)
  const nav = useNavigate()
  const [d, setD] = useState<ServiceDetail | null>(null)
  const [state, setState] = useState<"loading" | "ok" | "missing" | "error">("loading")
  const [defaultApp, setDefaultApp] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [sheet, setSheet] = useState<null | "qr" | "configs" | "revoke" | "delete">(null)
  const [qr, setQr] = useState<string | null>(null)
  const [configs, setConfigs] = useState<string[] | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(() => {
    if (!sid) { setState("missing"); return }
    setState((s) => (s === "ok" ? s : "loading"))
    getServiceDetail(sid).then((r) => { setD(r); setState("ok") }).catch((e) => setState(e?.status === 404 ? "missing" : "error"))
  }, [sid])
  useEffect(load, [load])
  useEffect(() => { getSettings().then((s) => setDefaultApp(s.default_app)).catch(() => undefined) }, [])
  useEffect(() => () => { if (qr) URL.revokeObjectURL(qr) }, [qr])

  if (state === "loading") return <div className="x-page"><PageTop title="سرویس" back="/services" /><PageSkeleton /></div>
  if (state === "missing") return <div className="x-page"><PageTop title="سرویس" back="/services" /><Card><Empty icon={<Server size={34} strokeWidth={1.5} />} title="سرویس پیدا نشد" sub="ممکن است حذف شده یا متعلق به حساب دیگری باشد." action={<Button onClick={() => nav("/services")}>سرویس‌های من</Button>} /></Card></div>
  if (state === "error" || !d) return <div className="x-page"><PageTop title="سرویس" back="/services" /><Alert tone="bad">دریافت اطلاعات سرویس ناموفق بود.</Alert><Button onClick={load}>تلاش دوباره</Button></div>

  const copyLink = async () => {
    if (!d.sub_link) return
    const ok = await copyText(d.sub_link)
    if (ok) { setCopied(true); hapticNotification("success"); toast.success("لینک اشتراک کپی شد"); setTimeout(() => setCopied(false), 1800) } else toast.error("کپی انجام نشد")
  }
  const showQr = async () => {
    setSheet("qr")
    if (qr) return
    try { setQr(URL.createObjectURL(await getServiceQrBlob(d.id))) } catch { toast.error("دریافت QR ناموفق بود") }
  }
  const showConfigs = async () => {
    setSheet("configs")
    if (configs) return
    try { setConfigs((await getServiceConfigs(d.id)).configs || []) } catch { setConfigs([]); toast.error("دریافت کانفیگ‌ها ناموفق بود") }
  }
  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    try { await fn() } catch (e: any) { toast.error(e?.message && !/^HTTP|^[a-z_]+$/.test(e.message) ? e.message : "عملیات ناموفق بود") } finally { setBusy(null) }
  }
  const revoke = () => run("revoke", async () => {
    const r = await revokeServiceLink(d.id)
    if (!r.success) throw new Error("ناموفق")
    setSheet(null); setConfigs(null); setQr(null); toast.success("لینک جدید ساخته شد و لینک قبلی باطل شد"); load()
  })
  const toggle = () => run("toggle", async () => {
    const r = await toggleServiceLink(d.id, !!d.link_disabled)
    if (!r.success) throw new Error("ناموفق")
    toast.success(d.link_disabled ? "لینک فعال شد" : "لینک غیرفعال شد"); load()
  })
  const remove = () => run("delete", async () => {
    await deleteService(d.id)
    toast.success("سرویس حذف شد"); nav("/services", { replace: true })
  })

  return (
    <div className="x-page">
      <PageTop title="مدیریت سرویس" sub={d.panel_name || undefined} back="/services" right={<Button iconOnly variant="ghost" aria-label="تازه‌سازی" onClick={load}><RefreshCw size={18} /></Button>} />
      <Hero d={d} />

      <div className="x-grid c2">
        <Button variant="primary" size="lg" icon={copied ? <Check size={18} /> : <Copy size={18} />} onClick={copyLink} disabled={!d.sub_link}>{copied ? "کپی شد" : "کپی لینک ساب"}</Button>
        <Button size="lg" icon={<QrCode size={18} />} onClick={showQr} disabled={!d.has_qr && !d.sub_link}>کد QR</Button>
        {d.can.renew && <Button size="lg" icon={<RotateCcw size={18} />} style={{ gridColumn: "1 / -1" }} onClick={() => nav("/custom-build", { state: { orderType: "renew", targetConfigId: d.id, planLabel: d.title } })}>تمدید سرویس</Button>}
      </div>

      <OpenInApp d={d} defaultApp={defaultApp} title={d.title} />
      <Connection d={d} />
      <UsageChart id={d.id} />

      {d.sub_link && (
        <Section title="لینک اشتراک">
          <Card>
            <div className="x-stack" style={{ gap: 10 }}>
              <code className="x-code">{d.sub_link}</code>
              <div className="x-grid c2">
                <Button icon={<QrCode size={17} />} onClick={showQr}>کد QR</Button>
                <Button icon={<FileText size={17} />} onClick={showConfigs} disabled={!d.can.configs}>کانفیگ‌ها</Button>
              </div>
            </div>
          </Card>
        </Section>
      )}

      <Section title="مدیریت">
        <Card pad0>
          <div className="x-list">
            {d.can.toggle && (
              <button className="x-item" onClick={toggle} disabled={busy === "toggle"}>
                <Tile icon={<Power size={18} />} tone={d.link_disabled ? "ok" : "warn"} />
                <div className="x-grow"><div className="t">{d.link_disabled ? "فعال‌سازی لینک" : "غیرفعال‌سازی موقت لینک"}</div><div className="s">{d.link_disabled ? "اتصال دوباره برقرار می‌شود" : "تا فعال‌سازی مجدد هیچ دستگاهی وصل نمی‌شود"}</div></div>
                <ChevronLeft size={17} className="chev" />
              </button>
            )}
            {d.can.revoke && (
              <button className="x-item" onClick={() => setSheet("revoke")}>
                <Tile icon={<KeyRound size={18} />} tone="violet" />
                <div className="x-grow"><div className="t">تغییر لینک ساب</div><div className="s">قطع دسترسی دیگران و صدور لینک جدید</div></div>
                <ChevronLeft size={17} className="chev" />
              </button>
            )}
            {d.can.delete && (
              <button className="x-item" onClick={() => setSheet("delete")}>
                <Tile icon={<Trash2 size={18} />} tone="bad" />
                <div className="x-grow"><div className="t" style={{ color: "var(--bad)" }}>حذف سرویس</div><div className="s">این کار قابل بازگشت نیست</div></div>
                <ChevronLeft size={17} className="chev" />
              </button>
            )}
          </div>
        </Card>
      </Section>

      <Sheet open={sheet === "qr"} onClose={() => setSheet(null)} title="کد QR اشتراک">
        <div style={{ display: "grid", placeItems: "center", minHeight: 260 }}>
          {qr ? <img src={qr} alt="QR" style={{ width: 260, height: 260, borderRadius: 16, background: "#fff", padding: 10, objectFit: "contain" }} /> : <Skeleton width={260} height={260} radius={16} />}
        </div>
        <div className="x-muted" style={{ textAlign: "center" }}>این کد را در برنامه‌ی VPN اسکن کنید.</div>
      </Sheet>

      <Sheet open={sheet === "configs"} onClose={() => setSheet(null)} title="کانفیگ‌ها"
        footer={configs && configs.length > 0 ? <Button variant="primary" icon={<Copy size={17} />} onClick={async () => { (await copyText(configs.join("\n"))) ? toast.success("همه‌ی کانفیگ‌ها کپی شد") : toast.error("کپی انجام نشد") }}>کپی همه‌ی کانفیگ‌ها</Button> : undefined}>
        {!configs ? <Skeleton height={80} radius={14} /> : configs.length === 0 ? <Empty title="کانفیگی یافت نشد" sub="از لینک ساب استفاده کنید." /> :
          configs.map((c, i) => (
            <div key={i} className="x-stack" style={{ gap: 6 }}>
              <code className="x-code" style={{ maxHeight: 96, overflow: "auto" }}>{c}</code>
              <Button size="sm" icon={<Link2 size={14} />} onClick={async () => { (await copyText(c)) ? toast.success("کپی شد") : toast.error("کپی انجام نشد") }}>کپی کانفیگ {faDigits(i + 1)}</Button>
            </div>
          ))}
      </Sheet>

      <Sheet open={sheet === "revoke"} onClose={() => setSheet(null)} title="تغییر لینک ساب"
        footer={<><Button variant="primary" loading={busy === "revoke"} onClick={revoke}>بله، لینک جدید بساز</Button><Button variant="ghost" onClick={() => setSheet(null)}>انصراف</Button></>}>
        <Alert tone="warn">لینک قبلی دیگر کار نخواهد کرد و باید لینک جدید را در برنامه‌ی خود دوباره اضافه کنید. حجم و زمان سرویس تغییر نمی‌کند.</Alert>
      </Sheet>

      <Sheet open={sheet === "delete"} onClose={() => setSheet(null)} title="حذف سرویس"
        footer={<><Button variant="danger" loading={busy === "delete"} onClick={remove}>بله، حذف شود</Button><Button variant="ghost" onClick={() => setSheet(null)}>انصراف</Button></>}>
        <Alert tone="bad">سرویس «{d.title}» برای همیشه حذف می‌شود و حجم/زمان باقی‌مانده بازگردانده نخواهد شد.</Alert>
      </Sheet>
    </div>
  )
}
