"use client";

import { useState } from "react";
import { FilterBar } from "@/components/search/FilterBar";
import { SearchBar } from "@/components/search/SearchBar";
import { useDietary } from "@/hooks/useDietary";

/**
 * Home action zone — caption, filter bar, and search, wired together.
 *
 * Filters are *staged* in local state: picking them doesn't navigate. They're
 * carried into the URL only when the user runs a search (`carryTags`), so the
 * user pre-configures constraints and then searches against them.
 *
 * The user's standing dietary preferences pre-seed that staged selection once
 * the store hydrates, so every search respects their diet by default. They
 * appear as the usual removable pills, so per-search control is preserved.
 * Seeded by deriving state during render (not an effect) to avoid a
 * cascading-render and an extra paint.
 */
export function HomeSearchControls() {
  const dietaryTags = useDietary((s) => s.tags);
  const dietaryHydrated = useDietary((s) => s.hasHydrated);

  const [tags, setTags] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);

  if (dietaryHydrated && !seeded) {
    setSeeded(true);
    if (dietaryTags.length > 0) setTags(dietaryTags);
  }

  return (
    <>
      <FilterBar selected={tags} onChange={setTags} />
      <div className="pt-6">
        <SearchBar size="lg" carryTags={tags} />
      </div>
    </>
  );
}
