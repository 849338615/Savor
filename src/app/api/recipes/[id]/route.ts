import { NextResponse } from "next/server";
import { getProvider } from "@/lib/recipes/getProvider";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const recipe = await getProvider().getRecipe(id);
  if (!recipe) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(recipe);
}
