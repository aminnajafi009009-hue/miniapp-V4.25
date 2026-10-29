import { Send, RefreshCcw, ShieldCheck } from "lucide-react";
import WebApp from "@twa-dev/sdk";
import { Button, Card, Tile } from "@/shared/ui/kit";

interface Props { channels: { name: string; url: string }[]; checking: boolean; onRecheck: () => void }
export default function JoinChannelsGate({ channels, checking, onRecheck }: Props) {
  const open = (raw: string) => {
    let url = (raw || "").trim()
    if (!url) return
    if (url.startsWith("@")) url = "https://t.me/" + url.slice(1)
    else if (!/^(https?|tg):\/\//i.test(url)) url = "https://" + url.replace(/^\/+/, "")
    try {
      if (/^https?:\/\/(t|telegram)\.me\//i.test(url)) WebApp.openTelegramLink(url)
      else WebApp.openLink(url)
    } catch {
      try { WebApp.openLink(url) } catch { window.open(url, "_blank") }
    }
  }
  return (
    <div className="x-page" style={{ paddingTop: 30 }}>
      <Card hero>
        <div className="x-stack" style={{ alignItems: "center", textAlign: "center", gap: 12 }}>
          <Tile icon={<ShieldCheck size={26} />} size="lg" solid />
          <div className="x-h2">عضویت در کانال‌ها الزامی است</div>
          <p className="x-sub">برای استفاده از امکانات، ابتدا در کانال‌های زیر عضو شوید و سپس «بررسی مجدد» را بزنید.</p>
          <div className="x-stack" style={{ width: "100%" }}>
            {channels.map((c, i) => <Button key={c.url || i} full icon={<Send size={16} />} onClick={() => open(c.url)}>{c.name}</Button>)}
          </div>
          <Button variant="primary" full loading={checking} icon={<RefreshCcw size={17} />} onClick={onRecheck}>بررسی مجدد عضویت</Button>
        </div>
      </Card>
    </div>
  )
}
