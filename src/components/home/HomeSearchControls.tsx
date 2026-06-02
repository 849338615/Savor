"use client";

import { useState } from "react";
import { FilterBar } from "@/components/search/FilterBar";
import { SearchBar } from "@/components/search/SearchBar";

/**
 * Home action zone — caption, filter bar, and search, wired together.
 *
 * Filters are *staged* in local state: picking them doesn't navigate. They're
 * carried into the URL only when the user runs a search (`carryTags`), so the
 * user pre-configures constraints and then searches against them.
 */
export function HomeSearchControls() {
  const [tags, setTags] = useState<string[]>([]);

  return (
    <>
      <FilterBar selected={tags} onChange={setTags} />
      <div className="pt-6">
        <SearchBar size="lg" carryTags={tags} />
      </div>
    </>
  );
}
