import { ReactNode } from "react";
import { Avatar, Card } from "@/shared/ui/kit";
interface P { title: string; subtitle?: string; avatar?: string; rightAction?: ReactNode }
export default function PremiumHeader({ title, subtitle, avatar, rightAction }: P) {
  return <Card><div className="x-row-flex"><Avatar name={title} src={avatar} /><div className="x-grow"><div className="x-h2 x-ellipsis">{title}</div>{subtitle && <div className="x-sub">{subtitle}</div>}</div>{rightAction}</div></Card>
}
