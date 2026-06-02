import * as React from "react"

import { cn } from "@/lib/utils"
import { hasNonEnglishContent, isAssessmentRoute } from "@/utils/englishValidation"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  disableEnglishValidation?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, defaultValue, disableEnglishValidation = false, ...props }, ref) => {
    const isAssessment = !disableEnglishValidation && isAssessmentRoute()
    
    // Evaluate value safely to determine if validation needs to run
    const currentVal = typeof value === "string" 
      ? value 
      : (typeof defaultValue === "string" ? defaultValue : "")

    const showError = isAssessment && hasNonEnglishContent(currentVal)

    return (
      <div className="w-full flex flex-col gap-1">
        <textarea
          value={value}
          defaultValue={defaultValue}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            showError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "",
            className
          )}
          ref={ref}
          {...props}
        />
        {showError && (
          <p className="text-red-500 text-xs font-medium mt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
            Answers should be entered only in English.
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

