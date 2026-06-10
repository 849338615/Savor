import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { RecipeHero } from "@/components/recipe/RecipeHero";
import { RecipeTabs } from "@/components/recipe/RecipeTabs";
import { getProvider } from "@/lib/recipes/getProvider";
import { ENTER_COOK } from "@/lib/transitions";

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { id } = await params;
  const recipe = await getProvider().getRecipe(id);
  if (!recipe) notFound();

  return (
    <div className="relative flex flex-col">
      <RecipeHero recipe={recipe} />

      <div className="flex flex-1 flex-col gap-5 px-5 pb-32 pt-5">
        <RecipeTabs recipe={recipe} />
      </div>

      {/* Sticky action bar */}
      <div
        className="sticky bottom-0 z-10 px-5 pt-6"
        style={{
          background:
            "linear-gradient(to top, var(--bg-app) 0%, var(--bg-app) 55%, color-mix(in oklch, var(--bg-app) 70%, transparent) 80%, transparent 100%)",
          paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)",
        }}
      >
        <Link
          href={`/recipe/${recipe.slug}/cook`}
          transitionTypes={[ENTER_COOK]}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-forest text-[15px] font-semibold text-soft-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--bg-brand-hover)] active:bg-[var(--bg-brand-pressed)]"
        >
          <Play size={16} strokeWidth={1.75} aria-hidden />
          Start cooking
        </Link>
      </div>
    </div>
  );
}
