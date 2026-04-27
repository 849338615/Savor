"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/recipes/types";
import { IngredientList } from "./IngredientList";
import { StepList } from "./StepList";

type Tab = "ingredients" | "steps";

const TABS: { id: Tab; label: string }[] = [
  { id: "ingredients", label: "Ingredients" },
  { id: "steps", label: "Steps" },
];

export function RecipeTabs({ recipe }: { recipe: Recipe }) {
  const [active, setActive] = useState<Tab>("ingredients");
  const panelId = `recipe-tabpanel-${active}`;

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Recipe sections"
        className="flex rounded-[var(--radius-pill)] bg-cream p-1"
      >
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              id={`recipe-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`recipe-tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={cn(
                "relative flex-1 rounded-[var(--radius-pill)] px-3 py-2.5 text-[14px] font-semibold transition-colors",
                isActive ? "text-forest" : "text-stone",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="recipe-tab-pill"
                  className="absolute inset-0 -z-0 rounded-[var(--radius-pill)] bg-surface shadow-[var(--shadow-xs)]"
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          id={panelId}
          role="tabpanel"
          aria-labelledby={`recipe-tab-${active}`}
          tabIndex={0}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {active === "ingredients" ? (
            <IngredientList
              recipeId={recipe.id}
              ingredients={recipe.ingredients}
              baseServings={recipe.servings}
            />
          ) : (
            <StepList steps={recipe.steps} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
