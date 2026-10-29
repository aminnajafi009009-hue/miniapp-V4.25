import { Skeleton as K } from "@/shared/ui/kit";
export default function Skeleton(p: { width?: string | number; height?: string | number; radius?: string | number; className?: string; style?: React.CSSProperties }) { return <K width={p.width} height={p.height} radius={p.radius} style={p.style} /> }
