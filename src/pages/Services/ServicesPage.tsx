import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Server, ChevronLeft, Clock } from "lucide-react"
import { Alert, Bar, Button, Card, Chip, Empty, PageTop, SearchBox, Skeleton, Tabs, Tile } from "@/shared/ui/kit"
import { getServices } from "@/shared/api/services"
import type { VipService } from "@/shared/api/types"
import { formatBytes, num, serviceTitle, timeAgo } from "@/shared/lib/format"
import { daysLabel, isExpiring, isInactive, isOnline, statusMeta } from "./status"

type Filter = "all" | "active" | "expiring" | "inactive"

export function ServiceCard({ s, onClick }: { s: VipService; onClick: () => void }) {
  const st = statusMeta(s.status)
  const pct = s.usage?.percent ?? null
  const online = isOnline(s.online_at)
  return (
    <Card tap onClick={onClick} style={{ padding: 14 }}>
      <div className="x-stack" style={{ gap: 11 }}>
        <div className="x-row-flex">
          <Tile icon={<Server size={19} />} tone={st.tone === "bad" ? "bad" : st.tone === "warn" ? "warn" : "blue"} />
          <div className="x-grow">
            <div className="x-h3 x-ellipsis">{serviceTitle(s)}</div>
            <div className="x-muted x-ellipsis">{s.last_app ? `آخرین برنامه: ${s.last_app}` : s.panel_name || "—"}</div>
          </div>
          <Chip tone={st.tone}>{st.label}</Chip>
        </div>
        <Bar value={pct} />
        <div className="x-between x-sub">
          <span className="num">{s.usage?.total == null && !s.unlimited_volume ? "—" : `مصرف ${formatBytes(s.usage?.used ?? 0)} · باقی‌مانده ${s.unlimited_volume || s.usage?.total === 0 ? "نامحدود" : formatBytes(s.usage?.remaining ?? 0)}`}</span>
          <span className="x-row-flex" style={{ gap: 6 }}>
            <Clock size={13} /> <span className="num">{s.unlimited_time ? "نامحدود" : daysLabel(s.remaining_days)}</span>
          </span>
        </div>
        <div className="x-between x-muted">
          <span className="x-row-flex" style={{ gap: 6 }}>
            <i className={`x-dot ${online ? "ok" : ""}`} />
            {online ? "آنلاین" : s.online_at ? `آخرین اتصال ${timeAgo(s.online_at)}` : "هنوز متصل نشده"}
          </span>
          <ChevronLeft size={16} />
        </div>
      </div>
    </Card>
  )
}

export default function ServicesPage() {
  const nav = useNavigate()
  const [list, setList] = useState<VipService[] | null>(null)
  const [err, setErr] = useState(false)
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const load = () => {
    setErr(false)
    setList(null)
    getServices().then((r) => setList(r.vip || [])).catch(() => setErr(true))
  }
  useEffect(load, [])

  const counts = useMemo(() => {
    const l = list || []
    return { all: l.length, active: l.filter((s) => !isInactive(s)).length, expiring: l.filter(isExpiring).length, inactive: l.filter(isInactive).length }
  }, [list])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (list || []).filter((s) => {
      if (filter === "active" && isInactive(s)) return false
      if (filter === "expiring" && !isExpiring(s)) return false
      if (filter === "inactive" && !isInactive(s)) return false
      return !t || serviceTitle(s).toLowerCase().includes(t) || (s.last_app || "").toLowerCase().includes(t)
    })
  }, [list, q, filter])

  return (
    <div className="x-page">
      <PageTop title="سرویس‌های من" sub={list ? `${num(list.length)} سرویس` : undefined}
        right={<Button size="sm" variant="primary" icon={<Plus size={16} />} onClick={() => nav("/subscription")}>خرید</Button>} />

      {err ? (
        <>
          <Alert tone="bad">دریافت سرویس‌ها ناموفق بود.</Alert>
          <Button onClick={load}>تلاش دوباره</Button>
        </>
      ) : !list ? (
        <>
          <Skeleton height={44} radius={13} />
          <Skeleton height={32} radius={16} width="80%" />
          {[0, 1, 2].map((i) => <Skeleton key={i} height={146} radius={22} />)}
        </>
      ) : list.length === 0 ? (
        <Card><Empty icon={<Server size={34} strokeWidth={1.5} />} title="هنوز سرویسی ندارید" sub="اولین اشتراک خود را بخرید تا اینجا نمایش داده شود."
          action={<Button variant="primary" onClick={() => nav("/subscription")}>خرید سرویس</Button>} /></Card>
      ) : (
        <>
          <SearchBox value={q} onChange={setQ} placeholder="جستجو در سرویس‌ها…" />
          <Tabs<Filter> value={filter} onChange={setFilter} options={[
            { value: "all", label: "همه", count: counts.all },
            { value: "active", label: "فعال", count: counts.active },
            { value: "expiring", label: "رو به اتمام", count: counts.expiring },
            { value: "inactive", label: "غیرفعال", count: counts.inactive },
          ]} />
          {shown.length === 0 ? <Empty title="موردی یافت نشد" sub="جستجو یا فیلتر را تغییر دهید." /> :
            shown.map((s) => <ServiceCard key={s.id} s={s} onClick={() => nav(`/services/${s.id}`)} />)}
        </>
      )}
    </div>
  )
}
