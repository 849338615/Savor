"use client";

import { useMemo } from "react";
import type { Ingredient } from "@/lib/recipes/types";
import { scaleAmount } from "@/lib/recipes/scale";
import { convertAmount } from "@/lib/units/convert";
import { useCookingSession } from "@/hooks/useCookingSession";
import { useUnits } from "@/hooks/useUnits";
import { IngredientItem } from "./IngredientItem";
import { ServingsStepper } from "./ServingsStepper";

interface IngredientListProps {
  recipeId: string;
  ingredients: Ingredient[];
  baseServings: number;
}

export function IngredientList({
  recipeId,
  ingredients,
  baseServings,
}: IngredientListProps) {
  const overrideServings = useCookingSession(
    (s) => s.servingsOverride[recipeId],
  );
  const setServings = useCookingSession((s) => s.setServings);
  const checkedMap = useCookingSession((s) => s.checkedIngredients);
  const toggleIngredient = useCookingSession((s) => s.toggleIngredient);

  // Use the in-memory default until the persisted preference rehydrates, so
  // the first client render matches the server-rendered amounts.
  const storedSystem = useUnits((s) => s.system);
  const unitsHydrated = useUnits((s) => s.hasHydrated);
  const system = unitsHydrated ? storedSystem : "metric";

  const servings = overrideServings ?? baseServings;
  const ratio = servings / baseServings;

  const scaled = useMemo(
    () =>
      ingredients.map((i) => ({
        ...i,
        // Scale to the chosen servings first, then express in the chosen
        // measurement system.
        scaledAmount: convertAmount(scaleAmount(i.amount, ratio), system),
      })),
    [ingredients, ratio, system],
  );

  return (
    <div className="flex flex-col gap-3">
      <ServingsStepper
        value={servings}
        baseValue={baseServings}
        onChange={(n) => setServings(recipeId, n)}
      />
      <ul className="flex flex-col gap-2">
        {scaled.map((i) => (
          <li key={i.id}>
            <IngredientItem
              ingredient={i}
              amountOverride={i.scaledAmount}
              checked={!!checkedMap[`${recipeId}:${i.id}`]}
              onToggle={() => toggleIngredient(recipeId, i.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
