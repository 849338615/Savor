/**
 * Scales an ingredient amount string by a ratio. Best-effort:
 *   "200g"      ratio 2  -> "400g"
 *   "1/2 cup"   ratio 4  -> "2 cup"
 *   "2 tbsp"    ratio 1.5-> "3 tbsp"
 *   "to taste"  any      -> "to taste"
 *
 * Strings with mixed units, ranges, or non-numeric leads are returned as-is.
 */
export function scaleAmount(amount: string | undefined, ratio: number): string | undefined {
  if (!amount) return amount;
  if (ratio === 1) return amount;

  const trimmed = amount.trim();
  // Match leading number: int, decimal, or simple fraction (a/b or a b/c)
  const match = trimmed.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return amount;

  const [, numericPart, rest] = match;
  const value = parseNumeric(numericPart);
  if (value == null) return amount;

  const scaled = value * ratio;
  return `${formatNumber(scaled)}${rest ? ` ${rest}` : ""}`;
}

function parseNumeric(raw: string): number | null {
  if (raw.includes(" ")) {
    // mixed fraction: "1 1/2"
    const [whole, frac] = raw.split(/\s+/);
    const fracVal = parseNumeric(frac);
    if (fracVal == null) return null;
    return Number(whole) + fracVal;
  }
  if (raw.includes("/")) {
    const [num, den] = raw.split("/").map(Number);
    if (!den) return null;
    return num / den;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  // round to 2 decimals, strip trailing zeros
  return n.toFixed(2).replace(/\.?0+$/, "");
}
