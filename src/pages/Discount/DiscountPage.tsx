import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { BadgePercent, CheckCircle2, ShoppingBag } from "lucide-react"
import { Alert, Button, Card, Input, PageTop, Tile } from "@/shared/ui/kit"
import { validateDiscount } from "@/shared/api/services"
import type { DiscountValidateResult } from "@/shared/api/types"
import { num, toman } from "@/shared/lib/format"

export default function DiscountPage() {
  const nav = useNavigate()
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<DiscountValidateResult | null>(null)

  const apply = async () => {
    if (!code.trim()) return
    setBusy(true)
    try {
      const r = await validateDiscount(code.trim())
      setRes(r)
      if (r.valid) toast.success("کد تخفیف معتبر است"); else toast.error("این کد تخفیف معتبر نیست")
    } catch { toast.error("بررسی کد تخفیف ناموفق بود") } finally { setBusy(false) }
  }
  return (
    <div className="x-page">
      <PageTop title="کد تخفیف" sub="اعتبار کد را بررسی کنید" back="/profile" />
      <Card hero>
        <div className="x-stack" style={{ gap: 12 }}>
          <div className="x-row-flex"><Tile icon={<BadgePercent size={22} />} size="lg" solid /><div className="x-sub">کد را وارد کنید تا میزان تخفیف آن را ببینید.</div></div>
          <Input placeholder="مثلاً OFF20" ltr value={code} onChange={(e) => setCode(e.target.value)} />
          <Button variant="primary" size="lg" full disabled={!code.trim()} loading={busy} onClick={apply}>بررسی اعتبار</Button>
        </div>
      </Card>
      {res?.valid && (
        <Alert tone="ok">
          <div className="x-row-flex" style={{ gap: 8 }}><CheckCircle2 size={16} />
            {res.discount_type === "amount" ? `این کد ${toman(res.amount || 0)} تخفیف دارد.` : `این کد ${num(res.percent || 0)}٪ تخفیف دارد.`}</div>
          <div style={{ marginTop: 4 }}>برای استفاده، آن را در صفحه‌ی خرید (کنار پلن موردنظر) وارد کنید.</div>
        </Alert>
      )}
      {res && !res.valid && <Alert tone="bad">این کد نامعتبر، منقضی یا برای شما غیرقابل استفاده است.</Alert>}
      <Button full icon={<ShoppingBag size={17} />} onClick={() => nav("/subscription")}>رفتن به خرید اشتراک</Button>
    </div>
  )
}
