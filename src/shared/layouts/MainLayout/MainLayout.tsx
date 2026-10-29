import { useCallback, useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AlertTriangle } from "lucide-react"
import PremiumBottomNavigation from "@/shared/ui/PremiumBottomNavigation"
import JoinChannelsGate from "@/shared/ui/JoinChannelsGate"
import { PageSkeleton, Alert, Button } from "@/shared/ui/kit"
import { getMembershipStatus } from "@/shared/api/services"
import { useUserStore } from "@/shared/store/userStore"

type Membership =
  | { status: "checking" }
  | { status: "joined" }
  | { status: "blocked"; channels: { name: string; url: string }[] }
  | { status: "error"; message: string }

/** Layout for end-user pages: membership gate + bottom navigation. */
export default function MainLayout() {
  const [m, setM] = useState<Membership>({ status: "checking" })
  const [rechecking, setRechecking] = useState(false)
  const [slow, setSlow] = useState(false)
  const fetchUser = useUserStore((s) => s.fetchUser)
  const loc = useLocation()

  // هر صفحه‌ی جدید از بالا شروع شود (نه از موقعیت اسکرول صفحه‌ی قبل)
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])

  useEffect(() => { void fetchUser() }, [fetchUser])

  const check = useCallback(async () => {
    setRechecking(true)
    try {
      const res = await getMembershipStatus()
      if (!res) throw new Error("empty response")
      setM(res.joined ? { status: "joined" } : { status: "blocked", channels: res.channels || [] })
    } catch (e) {
      setM({ status: "error", message: e instanceof Error ? e.message : String(e) })
    } finally { setRechecking(false) }
  }, [])

  useEffect(() => { void check() }, [check])
  useEffect(() => { const t = setTimeout(() => setSlow(true), 3500); return () => clearTimeout(t) }, [])

  return (
    <>
      <main className={`x-shell ${m.status === "blocked" ? "no-nav" : ""}`}>
        {m.status === "checking" && !slow ? <PageSkeleton />
          : m.status === "blocked" ? <JoinChannelsGate channels={m.channels} checking={rechecking} onRecheck={check} />
          : (
            <>
              {m.status === "error" && (
                <div style={{ marginBottom: 12 }}>
                  <Alert tone="warn">
                    <div>ارتباط با سرور برقرار نشد؛ ممکن است اطلاعات کامل نمایش داده نشود.</div>
                    <div className="x-muted ltr" style={{ wordBreak: "break-all" }}>{m.message}</div>
                    <Button size="sm" icon={<AlertTriangle size={14} />} onClick={() => void check()} style={{ marginTop: 8 }}>تلاش دوباره</Button>
                  </Alert>
                </div>
              )}
              <Outlet />
            </>
          )}
      </main>
      {m.status !== "blocked" && <PremiumBottomNavigation />}
    </>
  )
}
