"use client";

import { motion, AnimatePresence } from "motion/react";
import type { Step } from "@/lib/recipes/types";
import { cn } from "@/lib/utils";

interface CookingStepProps {
  step: Step;
  largeText?: boolean;
}

export function CookingStep({ step, largeText = false }: CookingStepProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full max-w-[360px] flex-col items-center gap-4"
      >
        {step.section && (
          <div
            className={cn(
              "font-semibold uppercase tracking-[0.14em] text-stone",
              largeText ? "text-[14px]" : "text-[12px]",
            )}
          >
            {step.section}
          </div>
        )}
        <h2
          className={cn(
            "font-display font-semibold leading-[1.18] tracking-[-0.005em] text-ink",
            largeText ? "text-[34px]" : "text-[28px]",
          )}
        >
          {step.title}
        </h2>
        <p
          className={cn(
            "leading-[1.55] text-ink/85",
            largeText ? "text-[19px]" : "text-[16px]",
          )}
        >
          {step.instruction}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
