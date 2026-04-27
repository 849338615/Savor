import { notFound } from "next/navigation";
import { getProvider } from "@/lib/recipes/getProvider";
import { CookingClient } from "./CookingClient";

interface CookPageProps {
  params: Promise<{ id: string }>;
}

export default async function CookPage({ params }: CookPageProps) {
  const { id } = await params;
  const recipe = await getProvider().getRecipe(id);
  if (!recipe) notFound();

  return <CookingClient recipe={recipe} />;
}
