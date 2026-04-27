import type { RawRecipeBlob, Recipe } from "./types";

/**
 * The parser boundary. In v1 the mock dataset is already structured, so this
 * is a no-op identity helper. The real future implementation will:
 *
 *   1. Inspect `jsonLd` for a `Recipe` schema (Schema.org). If present, map
 *      directly to our `Recipe` shape.
 *   2. Otherwise, run `rawText` through a Mozilla Readability + heuristic
 *      pipeline to find ingredient and step blocks.
 *   3. As a fallback, ask Claude (`claude-haiku-4-5`) for a structured
 *      extraction with JSON-mode output validated against `Recipe`.
 *
 * Keeping this function on the import path now means the future swap is
 * literally one file.
 */
export async function parseRawRecipe(_blob: RawRecipeBlob): Promise<Recipe> {
  throw new Error(
    "parseRawRecipe is not implemented in v1. The mock provider returns " +
      "pre-structured Recipe objects. Wire this up when integrating a real " +
      "extraction pipeline.",
  );
}
