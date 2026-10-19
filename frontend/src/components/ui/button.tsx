import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: "bg-white text-black hover:bg-zinc-200",
      secondary: "bg-zinc-800 text-white hover:bg-zinc-700",
      outline: "border border-zinc-700 text-white hover:bg-zinc-900",
      ghost: "text-zinc-400 hover:text-white hover:bg-zinc-900"
    }
    
    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg font-bold"
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all transform active:scale-95 disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
