import { ReactNode } from "react";
/** animation removed for performance; renders children as-is */
export default function FadeIn({ children }: { children: ReactNode; delay?: number; duration?: number; y?: number; once?: boolean }) { return <>{children}</> }
