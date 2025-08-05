import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suffix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, suffix, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-12",
            className
          )}
          ref={ref}
          {...props}
        />
        {suffix && (
          <div className="absolute right-0 flex items-center pr-4 pointer-events-none">
            <span className="text-gray-600 font-medium text-sm">{suffix}</span>
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }