import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Empty, Button } from "@/shared/ui/kit";
export default function ComingSoon({ title, icon, subtitle }: { title: string; icon: ReactNode; subtitle?: string }) {
  const nav = useNavigate()
  return <div className="x-page"><Card><Empty icon={icon} title={title} sub={subtitle || "این قابلیت هنوز فعال نشده است."} action={<Button size="sm" onClick={() => nav(-1)}>بازگشت</Button>} /></Card></div>
}
