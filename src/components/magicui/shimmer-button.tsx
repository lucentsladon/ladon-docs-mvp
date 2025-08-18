import { CSSProperties, FC, ReactNode } from "react"

import { cn } from "@/lib/utils"

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
  children?: ReactNode
}

const ShimmerButton: FC<ShimmerButtonProps> = ({
  shimmerColor = "#ffffff",
  shimmerSize = "0.05em",
  shimmerDuration = "3s",
  borderRadius = "100px",
  background = "radial-gradient(ellipse 80% 50% at 50% 120%,rgba(62, 61, 117),transparent)",
  className,
  children,
  ...props
}) => {
  return (
    <button
      style={
        {
          "--spread": "90deg",
          "--shimmer-color": shimmerColor,
          "--radius": borderRadius,
          "--speed": shimmerDuration,
          "--cut": shimmerSize,
          "--bg": background,
        } as CSSProperties
      }
      className={cn(
        "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden [border-radius:var(--radius)] border border-white/10 px-6 py-3 whitespace-nowrap text-white [background:var(--bg)] dark:text-black",
        "transform-gpu transition-transform duration-300 ease-in-out",
        "hover:scale-105 active:scale-95",
        className
      )}
      {...props}
    >
      {/* spark container */}
      <div className={cn("-z-30 blur-[2px]", "[container-type:size] absolute inset-0 overflow-visible")}>
        {/* spark */}
        <div className="absolute inset-0 right-[--cut] [border-radius:var(--radius)] [filter:blur(10px)] [background:var(--shimmer-color)]"></div>
        {/* glow */}
        <div className="absolute inset-0 right-[--cut] [border-radius:var(--radius)] [filter:blur(10px)] transition-all duration-1000 [background:var(--shimmer-color)] group-hover:right-[-10cqw]"></div>
      </div>
      {children}

      {/* Highlight */}
      <div
        className={cn(
          "absolute -z-20 flex [translate:0_0] place-items-center [border-radius:var(--radius)] [filter:blur(30px)] [background:conic-gradient(from_calc(270deg-(var(--spread)/2)),transparent_0_calc(var(--spread)/2),var(--shimmer-color)_calc(var(--spread)/2)_var(--spread),transparent_var(--spread))] [mask:linear-gradient(#00000000,0%_calc(100%-var(--cut)),#000000ff_100%)]",
          "animate-slide size-full"
        )}
      ></div>
    </button>
  )
}

export default ShimmerButton
