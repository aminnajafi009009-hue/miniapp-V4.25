import { ReactNode } from "react";
import { Button, ButtonProps } from "@/shared/ui/kit";
interface P extends Omit<ButtonProps, "variant" | "icon"> {
  children: ReactNode; leftIcon?: ReactNode; rightIcon?: ReactNode; fullWidth?: boolean
  variant?: "primary" | "secondary" | "glass" | "danger" | "ghost"
}
/** compat wrapper → kit Button */
export default function PremiumButton({ leftIcon, rightIcon, fullWidth, variant = "primary", children, ...p }: P) {
  const v = variant === "secondary" || variant === "glass" ? "default" : variant
  return <Button variant={v} full={fullWidth} icon={leftIcon} {...p}>{children}{rightIcon}</Button>
}
