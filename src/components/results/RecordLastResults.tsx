"use client";

import { useEffect } from "react";
import { useLastResults } from "@/hooks/useLastResults";

/**
 * Records the current /results query so the Home tab can return the user
 * here after a detour to Saved or Profile. Renders nothing.
 */
export function RecordLastResults({ q, tag }: { q: string; tag: string }) {
  const record = useLastResults((s) => s.record);
  useEffect(() => {
    if (!q && !tag) return;
    record(q, tag);
  }, [q, tag, record]);
  return null;
}
