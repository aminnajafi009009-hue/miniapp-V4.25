import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Gauge, Layers, Wallet as WalletIcon } from "lucide-react"
import { Alert, Button, Card, Input, KV, PageSkeleton, PageTop } from "@/shared/ui/kit"
import { ChoiceCard, StatusScreen, StickyBar } from "@/shared/ui/purchase"
import { createPayg, getPaygInfo, type PaygInfo, type PaygOption } from "@/shared/api/purchase"
import { friendlyErrorMessage } from "@/shared/api/client"
import { toman } from "@/shared/lib/format"

const LATIN = /^[A-Za-z0-9]+$/

export default function PaygPage() {
  const nav = useNavigate()
  const [info, setInfo] = useState<PaygInfo | null>(null)
  const [failed, setFailed] = useState(false)
  const [option, setOption] = useState<PaygOption | null>(null)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [doneId, setDoneId] = useState<number | null | undefined>(undefined)

  useEffect(() => {
    getPaygInfo().then((r) => { setInfo(r); if (r.options.length === 1) setOption(r.options[0]) }).catch(() => setFailed(true))
  }, [])

  if (failed) return <div className="x-page"><PageTop title="PAYG" back="/" /><Alert tone="bad">دریافت اطلاعات ناموفق بود.</Alert></div>
  if (!info) return <div className="x-page"><PageTop title="PAYG" back="/" /><PageSkeleton /></div>
  if (!info.enabled) return <div className="x-page"><PageTop title="PAYG" back="/" /><Alert tone="warn">سرویس PAYG در حال حاضر فعال نیست.</Alert></div>

  if (doneId !== undefined) return (
    <div className="x-page">
      <StatusScreen tone="ok" title="سرویس ساخته شد" text="سرویس PAYG شما آماده است. لینک اشتراک برایتان در ربات هم ارسال شد." />
      <div className="x-stack">
        <Button variant="primary" size="lg" full onClick={() => nav(doneId ? `/services/${doneId}` : "/services", { replace: true })}>مشاهده سرویس</Button>
      </div>
    </div>
  )

  if (!option) return (
    <div className="x-page">
      <PageTop title="سرویس PAYG" sub="یکی از پلن‌ها را انتخاب کنید" back="/" />
      <Alert tone="warn">در PAYG حجم و زمان نامحدود است و فقط بر اساس مصرف از کیف پول شما کسر می‌شود.</Alert>
      <div className="x-stack">
        {info.options.map((o) => <ChoiceCard key={o.num} icon={<Layers size={19} />} title={o.name} sub={`هر گیگ ${toman(o.price_per_gb)}`} onClick={() => setOption(o)} />)}
      </div>
    </div>
  )

  const short = info.wallet < info.min_balance
  const nameOk = LATIN.test(name.trim())
  const go = async () => {
    setBusy(true)
    try {
      const r = await createPayg(name.trim(), option.num)
      if (r.success) setDoneId(r.config_id ?? null)
    } catch (e) {
      toast.error(friendlyErrorMessage(e, "ساخت سرویس ناموفق بود"))
    } finally { setBusy(false) }
  }

  return (
    <div className="x-page">
      <PageTop title={`PAYG — ${option.name}`} back={info.options.length > 1 ? undefined : "/"} right={info.options.length > 1 ? <Button size="sm" variant="ghost" onClick={() => setOption(null)}>تغییر پلن</Button> : undefined} />
      <Card>
        <KV k={<span className="x-row-flex" style={{ gap: 6 }}><Gauge size={14} />نرخ هر گیگ مصرف</span>} v={<b>{toman(option.price_per_gb)}</b>} />
        <KV k="حجم / زمان" v="نامحدود" />
        <KV k="حداقل موجودی برای ساخت" v={toman(info.min_balance)} />
        <KV k={<span className="x-row-flex" style={{ gap: 6 }}><WalletIcon size={14} />موجودی شما</span>} v={<b style={{ color: short ? "var(--bad)" : "var(--ok)" }}>{toman(info.wallet)}</b>} />
      </Card>
      {short && <Alert tone="warn">برای ساخت سرویس باید موجودی کیف پول حداقل به این مقدار برسد. ابتدا کیف پول را شارژ کنید.</Alert>}
      <Card>
        <Input label="نام سرویس (انگلیسی و عدد)" value={name} placeholder="aminpayg1" ltr
          error={name && !nameOk ? "فقط حروف انگلیسی و عدد، بدون فاصله" : undefined}
          onChange={(e) => setName(e.target.value.replace(/\s/g, ""))} />
        <div className="x-muted">بعد از ساخت، هزینه‌ی هر گیگ مصرف‌شده خودکار از کیف پول کسر می‌شود. این مقدار فقط برای ساخت سرویس لازم است؛ تا وقتی موجودی کیف پول تمام نشود سرویس فعال می‌ماند و وقتی موجودی صفر شود سرویس {info.empty_action === "delete" ? "حذف" : "متوقف"} می‌شود.</div>
      </Card>
      <StickyBar>
        {short
          ? <Button variant="primary" size="lg" full onClick={() => nav("/wallet")}>شارژ کیف پول</Button>
          : <Button variant="primary" size="lg" full disabled={!nameOk} loading={busy} onClick={go}>ساخت سرویس PAYG</Button>}
      </StickyBar>
    </div>
  )
}
