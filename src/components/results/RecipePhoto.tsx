"use client";

import { useState } from "react";
import type { RecipeSummary } from "@/lib/recipes/types";
import { cn } from "@/lib/utils";
import { ThumbnailIllustration } from "./ThumbnailIllustration";

const FOOD_GRADIENTS = [
  "radial-gradient(circle at 30% 35%, #B5C9A8, #7BA489 60%, #5C8770)",
  "radial-gradient(circle at 65% 40%, #E7D9C2, #C7B898 70%, #92A37D)",
  "radial-gradient(circle at 40% 60%, #D9C7A8, #B8A07A 65%, #6E6B66)",
  "radial-gradient(circle at 55% 35%, #C9D8C6, #92A37D 55%, #4A6552)",
  "radial-gradient(circle at 35% 50%, #EFE7DA, #C9B89A 60%, #92A37D)",
  "radial-gradient(circle at 60% 55%, #DDE7D4, #92A37D 60%, #1F4D3A)",
  "radial-gradient(circle at 45% 40%, #F0DFC2, #D6B88B 55%, #8B7355)",
  "radial-gradient(circle at 50% 45%, #C9D8C6, #7BA489 50%, #1F4D3A)",
] as const;

interface RecipePhotoProps {
  recipe: Pick<RecipeSummary, "id" | "title" | "tags" | "gradient" | "thumbnail">;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Photo + gradient backstop. The gradient is always painted as the bg, so it
 * shows during image load and stays as a graceful fallback when a recipe site
 * blocks hotlinks or the URL 404s. Real photo fades in on top once it loads.
 */
export function RecipePhoto({ recipe, className, children }: RecipePhotoProps) {
  const [imageOk, setImageOk] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const idx =
    typeof recipe.gradient === "number"
      ? Math.max(0, Math.min(FOOD_GRADIENTS.length - 1, recipe.gradient))
      : null;
  const gradient = idx !== null ? FOOD_GRADIENTS[idx] : undefined;
  const showImage = !!recipe.thumbnail && imageOk;
  const showIllustration = !showImage && idx === null;

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      role="img"
      aria-label={recipe.title}
      style={gradient ? { background: gradient } : { background: "var(--color-sage-mist)" }}
    >
      {showIllustration && (
        <ThumbnailIllustration recipe={recipe} className="h-full w-full" />
      )}
      {showImage && (
        <img
          src={recipe.thumbnail}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setImageOk(false)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {children}
    </div>
  );
}
