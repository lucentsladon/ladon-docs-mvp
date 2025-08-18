"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"

const stepperVariants = cva("flex flex-col gap-2", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
})

interface StepperProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof stepperVariants> {
  currentStep: number
  steps: {
    title: string
    description?: string
  }[]
  onStepClick?: (step: number) => void
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ className, currentStep, steps, onStepClick, orientation, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full items-center justify-between",
          orientation === "vertical" ? "flex-col items-start" : "flex-row",
          className
        )}
        {...props}
      >
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center",
              orientation === "vertical" ? "flex-row items-start" : "flex-col items-center",
              "w-full"
            )}
          >
            <div className={cn("flex items-center", orientation === "vertical" ? "flex-row" : "flex-col", "relative")}>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  index < currentStep && "bg-primary border-primary text-primary-foreground",
                  index === currentStep && "border-primary",
                  index > currentStep && "bg-muted border-muted-foreground text-muted-foreground"
                )}
                onClick={() => onStepClick?.(index)}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <div className={cn("mt-2 text-center", orientation === "vertical" && "mt-0 ml-4")}>
                <h3 className="text-sm font-medium">{step.title}</h3>
                {step.description && <p className="text-muted-foreground text-xs">{step.description}</p>}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1",
                  orientation === "vertical" ? "-mt-2 ml-[15px] h-full min-h-[2rem] w-px" : "-mt-8 h-px w-full",
                  index < currentStep ? "bg-primary" : "bg-muted-foreground"
                )}
              />
            )}
          </div>
        ))}
      </div>
    )
  }
)
Stepper.displayName = "Stepper"

export { Stepper }
