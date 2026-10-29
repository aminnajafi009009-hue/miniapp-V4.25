import { ReactNode } from "react";
import { Row, Tone } from "@/shared/ui/kit";
interface P { icon: ReactNode; title: string; subtitle?: string; tone?: Tone; badge?: string; onClick?: () => void }
export default function MenuAction({ icon, title, subtitle, tone, badge, onClick }: P) {
  return <div className="x-card pad0" style={{ padding: 0, overflow: "hidden" }}><Row icon={icon} tone={tone} title={title} sub={subtitle} onClick={onClick} right={badge ? <span className="x-chip acc">{badge}</span> : undefined} /></div>
}
