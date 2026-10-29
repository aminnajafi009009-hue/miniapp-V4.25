import { useEffect, useState } from "react"
import { AlarmClock } from "lucide-react"

type Props = {
  expiresAt: string
  onExpire?: () => void
}

function parseExpiry(expiresAt: string): number {
  // اگر رشته timezone نداشته باشد، آن را UTC در نظر می‌گیریم (سازگار با فرمت بک‌اند).
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(expiresAt)
  const normalized = expiresAt.includes("T") ? expiresAt : expiresAt.replace(" ", "T")
  const iso = hasTz ? normalized : normalized + "Z"
  const ts = new Date(iso).getTime()
  return Number.isNaN(ts) ? Date.now() : ts
}

export function ExpiryCountdown({ expiresAt, onExpire }: Props) {
  const [remainingMs, setRemainingMs] = useState(() => parseExpiry(expiresAt) - Date.now())

  useEffect(() => {
    const targetTs = parseExpiry(expiresAt)
    const tick = () => {
      const next = targetTs - Date.now()
      setRemainingMs(next)
      if (next <= 0) {
        onExpire?.()
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt])

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const label = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  const tier = totalSeconds <= 60 ? "danger" : totalSeconds <= 300 ? "warning" : "normal"

  return (
    <div className={`x-alert ${tier === "danger" ? "bad" : tier === "warning" ? "warn" : ""}`} style={{ alignItems: "center" }}>
      <AlarmClock size={18} />
      <span>
        {totalSeconds > 0 ? `${label} تا انقضای فاکتور` : "این فاکتور منقضی شد"}
      </span>
    </div>
  )
}
