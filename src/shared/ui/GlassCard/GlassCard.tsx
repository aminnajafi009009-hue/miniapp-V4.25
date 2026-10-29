import { HTMLAttributes } from "react";
import { Card } from "@/shared/ui/kit";
/** compat wrapper → kit Card */
interface P extends HTMLAttributes<HTMLDivElement> { hover?: boolean; glow?: boolean }
export default function GlassCard({ hover: _h, glow, className, ...p }: P) { return <Card hero={glow} className={className} {...p} /> }
