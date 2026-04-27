/**
 * URL <-> recipe-id encoding.
 *
 * In the real provider, a recipe is identified by its source URL — but URLs
 * have characters that don't belong in a Next.js route segment. We base64url
 * the URL so it round-trips through `/recipe/[id]` cleanly. The encoded form
 * is also used as the user-facing slug.
 *
 * In the mock provider, ids are short slugs like `creamy-garlic-parmesan-pasta`.
 * Both paths share `/recipe/[id]` — the decoder is forgiving: if the segment
 * doesn't decode to a URL, the caller falls back to the mock lookup.
 */

export function encodeRecipeId(url: string): string {
  // Use the standard base64url alphabet — URL-safe, no padding.
  if (typeof Buffer !== "undefined") {
    return Buffer.from(url, "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  // Browser fallback (not used in server components, but keeps the helper safe).
  const b64 = btoa(unescape(encodeURIComponent(url)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeRecipeId(id: string): string | null {
  // Heuristic: only attempt URL decode if the id looks like base64url and is
  // longer than any reasonable mock slug.
  if (id.length < 20 || /[^A-Za-z0-9_-]/.test(id)) return null;
  try {
    const b64 = id.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const text =
      typeof Buffer !== "undefined"
        ? Buffer.from(padded, "base64").toString("utf-8")
        : decodeURIComponent(escape(atob(padded)));
    if (/^https?:\/\//.test(text)) return text;
    return null;
  } catch {
    return null;
  }
}

/**
 * Cheap deterministic hash → 0..7, used to pick a thumbnail gradient index.
 */
export function gradientIndexForUrl(url: string): number {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (h * 31 + url.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 8;
}
