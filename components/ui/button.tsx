import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "outline" | "ghost" | "token"
type Size = "sm" | "md" | "icon"

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:brightness-110 border border-transparent shadow-sm",
  outline: "bg-card text-foreground border border-border hover:bg-muted",
  ghost: "bg-transparent text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground",
  token:
    "bg-card text-foreground border border-border font-mono hover:border-primary hover:text-primary active:translate-y-px shadow-[0_1px_0_var(--border)]",
}

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2 text-xs gap-1",
  md: "h-9 px-3 text-sm gap-1.5",
  icon: "h-7 w-7 text-xs",
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({
  className,
  variant = "outline",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  )
}
