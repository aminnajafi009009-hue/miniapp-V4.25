type Props = { step: number; total: number; label?: string }
export function StepIndicator({ step, total, label }: Props) {
  const c = Math.max(1, Math.min(step, total))
  return (
    <div className="x-stack" style={{ gap: 8 }}>
      <div className="x-between"><span className="x-sub">{label ? `${label} — ` : ""}مرحله {c} از {total}</span></div>
      <div className="x-bar"><i style={{ width: `${(c / total) * 100}%` }} /></div>
    </div>
  )
}
