import { useState } from "react"
import { toast } from "sonner"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Card, Input, PageSkeleton, PageTop, Section, Switch, Chip } from "@/shared/ui/kit"

export default function AdminPayments() {
  const { data, error, setData } = useLoad<any>(() => adminGet("/payments"))
  const [busy, setBusy] = useState("")
  const [card, setCard] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [cry, setCry] = useState<Record<string, any>>({})
  const [open, setOpen] = useState("")
  const [adding, setAdding] = useState<any>(null)
  const send = async (section: string, values: any) => {
    setBusy(section + (values.symbol || ""))
    try { const r = await adminPost("/payments", { section, values }); setData(r); setCard(null); setWallet(null); setCry({}); toast.success("ذخیره شد") }
    catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) } finally { setBusy("") }
  }
  if (error) return <div className="x-page"><PageTop title="روش‌های پرداخت" back="/admin/more" /><Alert tone="bad">دریافت ناموفق بود</Alert></div>
  if (!data) return <div className="x-page"><PageTop title="روش‌های پرداخت" back="/admin/more" /><PageSkeleton /></div>
  const c = card ?? data.card, w = wallet ?? data.wallet
  return (
    <div className="x-page">
      <PageTop title="روش‌های پرداخت" back="/admin/more" />
      <Section title="کارت‌به‌کارت"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال</span><Switch checked={c.enabled} onChange={(v) => send("card", { enabled: v })} /></div>
        <div className="x-row-flex"><span className="x-grow">دکمه‌ی کپی شماره کارت</span><Switch checked={!!c.show_copy_card} onChange={(v) => send("card", { show_copy_card: v })} /></div>
        <div className="x-row-flex"><span className="x-grow">دکمه‌ی کپی مبلغ</span><Switch checked={!!c.show_copy_amount} onChange={(v) => send("card", { show_copy_amount: v })} /></div>
        <div className="x-row-flex"><span className="x-grow">قفل فوروارد فاکتور (پیام‌های دارای شماره کارت)</span><Switch checked={!!c.forward_lock} onChange={(v) => send("card", { forward_lock: v })} /></div>
        <div className="x-row-flex"><span className="x-grow">مبلغ رندوم (±۱۵۰۰ تومان؛ خاموش = مبلغ رند)</span><Switch checked={!!c.random_amount} onChange={(v) => send("card", { random_amount: v })} /></div>
        <Input label="شماره کارت" ltr inputMode="numeric" value={c.card_number} onChange={(e) => setCard({ ...c, card_number: e.target.value })} />
        <Input label="نام صاحب کارت" value={c.owner_name} onChange={(e) => setCard({ ...c, owner_name: e.target.value })} />
        <Input label="بانک" value={c.bank_name} onChange={(e) => setCard({ ...c, bank_name: e.target.value })} />
        {card && <Button variant="primary" loading={busy === "card"} onClick={() => send("card", { card_number: card.card_number, owner_name: card.owner_name, bank_name: card.bank_name })}>ذخیره‌ی کارت</Button>}
      </div></Card></Section>
      <Section title="شارژ کیف پول"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال</span><Switch checked={w.enabled} onChange={(v) => send("wallet", { enabled: v })} /></div>
        <div className="x-grid c2"><Input label="حداقل شارژ" type="number" value={w.min_charge} onChange={(e) => setWallet({ ...w, min_charge: e.target.value })} /><Input label="حداکثر شارژ" type="number" value={w.max_charge} onChange={(e) => setWallet({ ...w, max_charge: e.target.value })} /></div>
        <Input label="درصد هدیه‌ی شارژ" type="number" value={w.gift_percent} onChange={(e) => setWallet({ ...w, gift_percent: e.target.value })} />
        <Input label="حد هشدار موجودی کم (تومان؛ ۰ = غیرفعال) — با رسیدن موجودی کاربر به زیر این مبلغ اعلان «کم‌شدن موجودی» با دکمه‌ی شارژ ارسال می‌شود" type="number" value={w.low_balance ?? 0} onChange={(e) => setWallet({ ...w, low_balance: e.target.value })} />
        {wallet && <Button variant="primary" loading={busy === "wallet"} onClick={() => send("wallet", { min_charge: wallet.min_charge, max_charge: wallet.max_charge, gift_percent: wallet.gift_percent, low_balance: wallet.low_balance })}>ذخیره</Button>}
      </div></Card></Section>
      <Section title="ارز دیجیتال"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">کل بخش ارز دیجیتال</span><Switch checked={data.crypto.master} onChange={(v) => send("crypto_master", { enabled: v })} /></div>
        {data.crypto.items.map((x: any) => {
          const e = cry[x.symbol] ?? x
          const set = (k: string, v: any) => setCry({ ...cry, [x.symbol]: { ...e, [k]: v } })
          return (
            <div key={x.symbol} className="x-stack" style={{ gap: 8 }}>
              <div className="x-row-flex"><div className="x-grow" onClick={() => setOpen(open === x.symbol ? "" : x.symbol)}><div className="x-h3">{x.name} <span className="x-muted">{x.symbol} · {x.network}</span></div><div className="x-muted">{x.has_wallet ? "آدرس کیف پول ثبت شده" : <Chip tone="warn">آدرس کیف پول ثبت نشده</Chip>}</div></div><Switch checked={x.enabled} onChange={(v) => send("crypto", { symbol: x.symbol, enabled: v })} /></div>
              {open === x.symbol && (
                <div className="x-stack" style={{ gap: 8 }}>
                  <Input label="نام ارز" value={e.name} onChange={(ev) => set("name", ev.target.value)} />
                  <Input label="آدرس کیف پول" ltr value={e.wallet || ""} onChange={(ev) => set("wallet", ev.target.value)} />
                  <div className="x-grid c2">
                    <Input label="مارجین (٪)" type="number" value={e.margin_percent} onChange={(ev) => set("margin_percent", ev.target.value)} />
                    <Input label="حداقل (تومان)" type="number" value={e.min_amount_toman} onChange={(ev) => set("min_amount_toman", ev.target.value)} />
                  </div>
                  <Input label="قیمت پشتیبان (تومان؛ ۰ = ندارد)" type="number" value={e.backup_price ?? 0} onChange={(ev) => set("backup_price", ev.target.value)} />
                  <div className="x-row-flex">
                    <Button variant="primary" loading={busy === "crypto" + x.symbol} onClick={() => send("crypto", { symbol: x.symbol, name: e.name, wallet: e.wallet || "", margin_percent: e.margin_percent, min_amount_toman: e.min_amount_toman, backup_price: e.backup_price || 0 })}>ذخیره</Button>
                    <Button variant="danger" loading={busy === "crypto_delete" + x.symbol} onClick={() => { if (window.confirm(`حذف ${x.symbol}؟`)) send("crypto_delete", { symbol: x.symbol }) }}>حذف ارز</Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {adding ? (
          <div className="x-stack" style={{ gap: 8 }}>
            <div className="x-grid c2"><Input label="نماد (مثلاً SOL)" ltr value={adding.symbol || ""} onChange={(e) => setAdding({ ...adding, symbol: e.target.value })} /><Input label="نام" value={adding.name || ""} onChange={(e) => setAdding({ ...adding, name: e.target.value })} /></div>
            <Input label="شبکه" ltr value={adding.network || ""} onChange={(e) => setAdding({ ...adding, network: e.target.value })} />
            <Input label="آدرس کیف پول (اختیاری)" ltr value={adding.wallet || ""} onChange={(e) => setAdding({ ...adding, wallet: e.target.value })} />
            <div className="x-row-flex"><Button variant="primary" loading={busy === "crypto_add"} onClick={async () => { await send("crypto_add", adding); setAdding(null) }}>افزودن</Button><Button onClick={() => setAdding(null)}>انصراف</Button></div>
          </div>
        ) : <Button onClick={() => setAdding({})}>➕ افزودن ارز</Button>}
      </div></Card></Section>
    </div>
  )
}
