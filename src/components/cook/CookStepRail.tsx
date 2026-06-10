"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { cn } from "@/lib/utils";

const DOT = 8; // base dot diameter (px); matches h-2 w-2

interface CookStepRailProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}

/**
 * Cook-mode step rail with a single forest "droplet" that rides between
 * evenly-spaced dots. The droplet's width stretches in proportion to its
 * travel velocity and a matching vertical squash conserves its "volume" —
 * so each step change reads as one fluid, liquid lunge that reaches toward
 * the neighbouring dot and settles back into a circle, rather than a hard
 * jump. The dot count is fixed; only the droplet moves.
 *
 * Positions are measured (not computed) so the droplet stays aligned across
 * breakpoints, safe-area changes, and any future spacing tweaks.
 */
export function CookStepRail({ total, current, onSelect }: CookStepRailProps) {
  const railRef = useRef<HTMLOListElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [centers, setCenters] = useState<number[]>([]);
  const [centerY, setCenterY] = useState(DOT);
  const reduce = useReducedMotion();

  // Measure each dot's centre relative to the rail so the droplet can be
  // positioned in absolute pixels. Re-measure on resize / step-count change.
  useLayoutEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      if (!rail) return;
      const box = rail.getBoundingClientRect();
      const next: number[] = [];
      for (let i = 0; i < total; i++) {
        const el = dotRefs.current[i];
        if (!el) {
          next.push(0);
          continue;
        }
        const r = el.getBoundingClientRect();
        next.push(r.left + r.width / 2 - box.left);
        if (i === 0) setCenterY(r.top + r.height / 2 - box.top);
      }
      setCenters(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (railRef.current) ro.observe(railRef.current);
    return () => ro.disconnect();
  }, [total]);

  const x = useMotionValue(0);
  const measured = centers.length > 0;

  // Spring the droplet to the active dot; its velocity drives the stretch.
  useEffect(() => {
    if (!measured) return;
    const target = centers[current] ?? 0;
    if (reduce) {
      x.set(target);
      return;
    }
    const controls = animate(x, target, {
      type: "spring",
      stiffness: 380,
      damping: 30,
      mass: 1,
    });
    return () => controls.stop();
  }, [current, centers, measured, reduce, x]);

  // Stretch ∝ speed (capped); squash keeps the droplet's area roughly constant.
  const velocity = useVelocity(x);
  const smoothV = useSpring(velocity, { stiffness: 500, damping: 50, mass: 1 });
  const scaleX = useTransform(smoothV, (v) =>
    reduce ? 1 : 1 + Math.min(Math.abs(v) / 1300, 1) * 1.9,
  );
  const scaleY = useTransform(scaleX, (s) => 1 / Math.sqrt(s));

  return (
    <div className="relative mx-auto w-full max-w-[360px] pb-1">
      <ol
        ref={railRef}
        aria-label="Step rail"
        className="relative flex items-center justify-between px-3"
      >
        {Array.from({ length: total }).map((_, i) => {
          const done = i < current;
          const isCurrent = i === current;
          return (
            <li key={i} className="flex">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`Go to step ${i + 1}`}
                aria-current={isCurrent ? "step" : undefined}
                className="grid h-11 w-11 place-items-center"
              >
                <span
                  ref={(el) => {
                    dotRefs.current[i] = el;
                  }}
                  aria-hidden
                  className={cn(
                    "block h-2 w-2 rounded-full transition-colors duration-300",
                    done || isCurrent ? "bg-forest" : "bg-forest/20",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ol>

      {/* The droplet rests exactly over the current dot and stretches in flight. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-0 rounded-full bg-forest"
        style={{
          height: DOT,
          width: DOT,
          top: centerY,
          marginLeft: -DOT / 2,
          x,
          y: "-50%",
          scaleX,
          scaleY,
          opacity: measured ? 1 : 0,
        }}
      />
    </div>
  );
}
