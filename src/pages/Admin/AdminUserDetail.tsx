import { txMeta, TxAmount } from "@/shared/lib/tx"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { Ban, CheckCircle2, Handshake, MessageSquare, PlusCircle, MinusCircle, Server } from "lucide-react"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { ask } from "@/shared/lib/confirm"
import { Alert, Avatar, Button, Card, Chip, Input, KV, PageSkeleton, PageTop, Row, Section, Sheet, Textarea, List, Empty } from "@/shared/ui/kit"
import { faDigits, jalaliDate, num, toman } from "@/shared/lib/format"

export default function AdminUserDetail() {
  const { tid = "" } = useParams()
  const { data, error, reload } = useLoad<any>(() => adminGet(`/users/${tid}`), [tid])
  const [sheet, setSheet] = useState<"wallet" | "msg" | null>(null)
  const [amount, setAmount] = useState("")
  const [sign, setSign] = useState<1 | -1>(1)
  const [note, setNote] = useState("")
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  if (error) return <div className="x-page"><PageTop title="کاربر" back="/admin/users" /><Alert tone="bad">کاربر پیدا نشد.</Alert></div>
  if (!data) return <div className="x-page"><PageTop title="کاربر" back="/admin/users" /><PageSkeleton /></div>
  const u = data.user
  const run = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true)
    try { await fn(); toast.success(ok); setSheet(null); setAmount(""); setNote(""); setText(""); await reload() }
    catch (e) { toast.error(friendlyErrorMessage(e, "عملیات ناموفق بود")) } finally { setBusy(false) }
  }
  return (
    <div className="x-page">
      <PageTop title={u.name || u.telegram_id} sub={faDigits(u.telegram_id)} back="/admin/users" />
      <Card hero>
        <div className="x-row-flex"><Avatar name={u.name} size={52} />
          <div className="x-grow"><div className="x-h2">{u.name}</div><div className="x-muted">عضویت: {jalaliDate(u.joined)}</div></div>
          {u.is_blocked ? <Chip tone="bad" icon={<Ban size={12} />}>مسدود</Chip> : <Chip tone="ok" icon={<CheckCircle2 size={12} />}>فعال</Chip>}
        </div>
        <div className="x-divider" />
        <KV k="موجودی کیف پول" v={<b>{toman(u.wallet)}</b>} />
        {u.locked_wallet > 0 && <KV k="موجودی قفل" v={toman(u.locked_wallet)} />}
        <KV k="مجموع خرید" v={toman(u.total_purchase)} />
        <KV k="دعوت‌ها" v={`${faDigits(u.successful_invites)} موفق از ${faDigits(u.invited_count)}`} />
        {data.referrer && <KV k="معرف" v={data.referrer.name} />}
        {data.agent && <KV k="نماینده" v={<Chip tone="info" icon={<Handshake size={12} />}>{faDigits(data.agent.percent)}٪</Chip>} />}
      </Card>
      <div className="x-grid c2">
        <Button variant="primary" icon={<PlusCircle size={16} />} onClick={() => { setSign(1); setSheet("wallet") }}>شارژ کیف پول</Button>
        <Button icon={<MinusCircle size={16} />} onClick={() => { setSign(-1); setSheet("wallet") }}>کسر از کیف پول</Button>
        <Button icon={<MessageSquare size={16} />} onClick={() => setSheet("msg")}>ارسال پیام</Button>
        <Button variant={u.is_blocked ? "ok" : "danger"} icon={<Ban size={16} />} onClick={async () => { if (await ask(u.is_blocked ? "کاربر آزاد شود؟" : "کاربر مسدود شود؟")) run(() => adminPost(`/users/${tid}/block`), u.is_blocked ? "کاربر آزاد شد" : "کاربر مسدود شد") }}>{u.is_blocked ? "رفع مسدودی" : "مسدود کردن"}</Button>
      </div>
      <Section title={`سرویس‌ها (${faDigits(data.services.length)})`}>
        {data.services.length === 0 ? <Empty title="سرویسی ندارد" /> : <List>{data.services.map((s: any) => <Row key={s.id} chevron={false} icon={<Server size={18} />} tone={s.disabled ? "bad" : "violet"} title={s.plan} sub={s.expiry ? `انقضا: ${jalaliDate(s.expiry)}` : "بدون انقضا"} right={s.disabled ? <Chip tone="bad">غیرفعال</Chip> : undefined} />)}</List>}
      </Section>
      <Section title="آخرین سفارش‌ها">
        {data.orders.length === 0 ? <Empty title="سفارشی ندارد" /> : <List>{data.orders.map((o: any) => <Row key={o.id} chevron={false} title={o.plan_name} sub={jalaliDate(o.created_at)} right={<span className="x-stack" style={{ gap: 2, alignItems: "flex-end" }}><b className="num">{num(o.price)}</b><Chip tone={["completed", "paid", "active"].includes(o.status) ? "ok" : "warn"}>{o.status}</Chip></span>} />)}</List>}
      </Section>
      <Section title="تراکنش‌های کیف پول">
        {data.transactions.length === 0 ? <Empty title="تراکنشی نیست" /> : <List>{data.transactions.map((t: any, i: number) => <Row key={i} chevron={false} title={t.description || t.type} sub={jalaliDate(t.created_at, true)} icon={txMeta(t).icon} tone={txMeta(t).tone} right={<TxAmount t={t} />} />)}</List>}
      </Section>
      <Sheet open={sheet === "wallet"} onClose={() => setSheet(null)} title={sign > 0 ? "شارژ کیف پول" : "کسر از کیف پول"}
        footer={<Button variant="primary" size="lg" full loading={busy} disabled={!Number(amount)} onClick={() => run(() => adminPost(`/users/${tid}/wallet`, { amount: sign * Number(amount), note }), "انجام شد")}>تأیید</Button>}>
        <Input label="مبلغ (تومان)" type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input label="توضیح (اختیاری)" value={note} onChange={(e) => setNote(e.target.value)} />
      </Sheet>
      <Sheet open={sheet === "msg"} onClose={() => setSheet(null)} title="ارسال پیام به کاربر"
        footer={<Button variant="primary" size="lg" full loading={busy} disabled={!text.trim()} onClick={() => run(async () => { const r = await adminPost(`/users/${tid}/message`, { text }); if (!r.sent) throw new Error("not sent") }, "پیام ارسال شد")}>ارسال</Button>}>
        <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="متن پیام…" />
      </Sheet>
    </div>
  )
}
