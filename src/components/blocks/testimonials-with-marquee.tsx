"use client"

import { motion } from "motion/react"

import { Marquee } from "@/components/magicui/marquee"
import { TestimonialAuthor, TestimonialCard } from "@/components/ui/testimonial-card"
import { cn } from "@/lib/utils"

interface TestimonialsSectionProps {
  title: React.ReactNode
  description: string
  testimonials: Array<{
    author: TestimonialAuthor
    text: string
    href?: string
  }>
  className?: string
}

export function TestimonialsSection({ title, description, testimonials, className }: TestimonialsSectionProps) {
  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  }

  return (
    <section className={cn("bg-background text-foreground", "px-0 py-8 sm:py-16 md:py-20", className)}>
      <div className="container mx-auto flex flex-col items-center">
        <motion.div
          className="mb-12 flex flex-col items-center px-4 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={titleVariants}
        >
          <h2 className="font-lora max-w-[720px] text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h2>
          <p className="text-md text-muted-foreground mt-6 max-w-[600px] sm:text-lg">{description}</p>
        </motion.div>
        <div
          className="relative flex w-full flex-col items-center justify-center overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          }}
        >
          <Marquee pauseOnHover className="[--duration:30s] [--gap:1rem]">
            {testimonials.map((testimonial, i) => (
              <TestimonialCard key={`testimonial-${i}`} {...testimonial} />
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  )
}
