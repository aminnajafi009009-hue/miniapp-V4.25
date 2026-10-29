import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
interface P extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; leftIcon?: ReactNode; rightIcon?: ReactNode }
const PremiumInput = forwardRef<HTMLInputElement, P>(({ label, error, leftIcon, rightIcon, className, ...p }, ref) => (
  <div className="x-field">
    {label && <label className="x-label">{label}</label>}
    <div style={{ position: "relative" }}>
      {leftIcon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}>{leftIcon}</span>}
      <input ref={ref} className={`x-input ${error ? "err" : ""} ${className ?? ""}`} style={{ paddingLeft: leftIcon ? 38 : undefined, paddingRight: rightIcon ? 38 : undefined }} {...p} />
      {rightIcon && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}>{rightIcon}</span>}
    </div>
    {error && <span className="x-err">{error}</span>}
  </div>
));
PremiumInput.displayName = "PremiumInput";
export default PremiumInput;
