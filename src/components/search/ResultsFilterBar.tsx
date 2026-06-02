"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FilterBar } from "./FilterBar";
import { parseTags, serializeTags } from "@/lib/filters";

/**
 * Results-page filter bar. The URL is the source of truth: selections come
 * from the `tag` param, and applying (or removing a pill) pushes a new URL —
 * reissuing the search via the page's keyed Suspense boundary.
 */
export function ResultsFilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const selected = parseTags(params?.get("tag"));
  const q = params?.get("q") ?? "";

  function onChange(tags: string[]) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (tags.length) next.set("tag", serializeTags(tags));
    const search = next.toString();
    router.push(`/results${search ? `?${search}` : ""}`);
  }

  return <FilterBar selected={selected} onChange={onChange} />;
}
