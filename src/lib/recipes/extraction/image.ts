/**
 * Upgrade a recipe image URL to its highest-fidelity version.
 *
 * Recipe sites — almost all on WordPress — serve scaled-down image variants
 * by appending a size suffix to the filename (`-768x1024.jpg`,
 * `-300x300.jpg`, `-150x150.jpg`) or a downsizing query param (`?w=300`,
 * `?resize=600,400`, `?fit=300,200`). The original full-resolution upload
 * lives at the same path with neither.
 *
 * What this function does:
 *
 *   - `…/garlic-butter-steak-bites-12-768x1024.jpg`
 *      → `…/garlic-butter-steak-bites-12.jpg`
 *
 *   - `…/photo.jpg?w=300&ssl=1`
 *      → `…/photo.jpg?ssl=1`
 *
 *   - `…/photo.jpg?resize=300,200`     → `…/photo.jpg`
 *   - `…/photo.jpg?fit=300%2C200`      → `…/photo.jpg`
 *   - `…/photo.jpg?strip=info&quality=80` → unchanged (not a downsizer)
 *
 * **Signed CDN URLs are left alone.** Imgix, Cloudinary, Sirv, and signed
 * Jetpack/Photon URLs include an HMAC parameter (`s=<hex>`, `signature=…`)
 * that signs the *exact* set of transformations. Stripping any signed
 * parameter invalidates the signature and the CDN returns 401/403, which
 * shows up as an `onError` → gradient backstop in the UI. We detect these
 * via either a known host or the presence of a 32-char hex `s` param and
 * return the URL unchanged. The pre-signed transformation already gives a
 * reasonable size; getting a higher-res variant would require server-side
 * URL re-signing, which we don't have credentials for.
 *
 * Hosted CDNs that embed size in the path (e.g. `…/w_300/…`) are also left
 * alone — a wrong upgrade that 404s is worse than an un-upgraded image
 * that simply looks soft.
 */

const WP_SIZE_SUFFIX = /-(\d{2,4})x(\d{2,4})(?=\.(?:jpe?g|png|webp|avif|gif)(?:[?#]|$))/i;

const DOWNSIZING_PARAMS = new Set([
  "w", "width",
  "h", "height",
  "resize", "fit", "size",
  "imwidth", "imageopt",
]);

/**
 * Hosts whose URLs are typically signed (HMAC-validated transformations).
 * Don't touch query strings on these — even when a signature param isn't
 * obviously present, modifying the URL is high-risk and the upgrade payoff
 * is minimal because the pre-signed variant is already a usable size.
 */
const SIGNED_CDN_HOST_RE =
  /(^|\.)(imgix\.net|sanity\.io|cloudinary\.com|sirv\.com|cloudfront\.net|akamaihd\.net)$/i;

/** 32-char lowercase hex — the shape of an Imgix `s=` HMAC. */
const HMAC_RE = /^[a-f0-9]{32,64}$/i;

export function upgradeImageUrl(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  let url: URL;
  try {
    url = new URL(trimmed, "https://placeholder.invalid");
  } catch {
    return trimmed;
  }
  if (url.hostname === "placeholder.invalid") return trimmed;

  if (isSignedUrl(url)) return trimmed;

  url.pathname = url.pathname.replace(WP_SIZE_SUFFIX, "");

  const drop: string[] = [];
  url.searchParams.forEach((_value, key) => {
    if (DOWNSIZING_PARAMS.has(key.toLowerCase())) drop.push(key);
  });
  for (const key of drop) url.searchParams.delete(key);

  // Reassemble. URL.toString re-encodes; preserve original input shape when
  // we made no real change (avoids churning cache keys downstream).
  const next = url.toString();
  return next === sanitize(trimmed) ? trimmed : next;
}

/**
 * A URL is "signed" if either:
 *   - It carries an HMAC-shaped `s=` / `signature=` / `sig=` query param, or
 *   - It lives on a host that we know signs URLs by default (Imgix, Sanity).
 *
 * Imgix is the dominant case for this app — Modern Proper, Bon Appétit,
 * Eater, Serious Eats, and many Conde Nast properties all serve through
 * `images.<brand>.com` Imgix subdomains with signed transformations.
 */
function isSignedUrl(url: URL): boolean {
  for (const key of ["s", "signature", "sig", "x-amz-signature"]) {
    const v = url.searchParams.get(key);
    if (v && HMAC_RE.test(v)) return true;
  }
  if (SIGNED_CDN_HOST_RE.test(url.hostname)) return true;
  // The host pattern most recipe-publisher Imgix tenants use.
  if (/^images\.[a-z0-9-]+\.com$/i.test(url.hostname)) return true;
  return false;
}

function sanitize(s: string): string {
  try {
    return new URL(s).toString();
  } catch {
    return s;
  }
}
