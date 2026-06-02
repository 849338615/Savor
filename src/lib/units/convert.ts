/**
 * Measurement-system conversion for ingredient amount strings.
 *
 * Operates on the legacy `amount` display string (e.g. "200g", "1 1/2 cups",
 * "2 tbsp") — the same string `scaleAmount` produces — so it composes after
 * serving-scaling without needing the structured quantity/unit back.
 *
 * Design decisions (intentionally conservative, so conversions never read as
 * machine output):
 *   • Only *weight* (g/kg ↔ oz/lb) and *system-specific volume*
 *     (cup/fl oz/pint/quart/gallon ↔ ml/l) are converted.
 *   • tsp / tbsp are treated as **system-neutral** — real metric and imperial
 *     recipes both use them for small amounts — so "2 tbsp" stays "2 tbsp" in
 *     either system rather than becoming "30 ml".
 *   • Counts and descriptive units ("3 cloves", "1 piece", "to taste") and any
 *     unit we don't recognize pass through untouched.
 *   • Output is rounded to practical cooking amounts (sensible metric steps;
 *     curated fractions for imperial), because cross-system conversion is
 *     inherently approximate.
 */

export type UnitSystem = "metric" | "imperial";

export function unitSystemLabel(system: UnitSystem): string {
  return system === "metric" ? "Metric" : "Imperial";
}

/* ----------------------------- unit tables ----------------------------- */
/* Factors normalize to a base: grams for weight, milliliters for volume.
   Keys are period-free and lowercase — see `normalizeUnit`. tsp/tbsp are
   deliberately absent so they fall through as neutral. */

const WEIGHT_TO_GRAMS: Record<string, number> = {
  mg: 0.001, milligram: 0.001, milligrams: 0.001,
  g: 1, gram: 1, grams: 1, gramme: 1, grammes: 1,
  kg: 1000, kilo: 1000, kilos: 1000, kilogram: 1000, kilograms: 1000,
  kilogramme: 1000, kilogrammes: 1000,
  oz: 28.3495, ounce: 28.3495, ounces: 28.3495,
  lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1, milliliter: 1, milliliters: 1, millilitre: 1, millilitres: 1,
  cl: 10, centiliter: 10, centilitre: 10,
  l: 1000, liter: 1000, liters: 1000, litre: 1000, litres: 1000,
  cup: 236.588, cups: 236.588, c: 236.588,
  "fl oz": 29.5735, floz: 29.5735, "fluid ounce": 29.5735, "fluid ounces": 29.5735,
  pint: 473.176, pints: 473.176, pt: 473.176,
  quart: 946.353, quarts: 946.353, qt: 946.353,
  gallon: 3785.41, gallons: 3785.41, gal: 3785.41,
};

// Imperial volume output measures.
const ML_PER_TSP = 4.92892;
const ML_PER_TBSP = 14.7868;
const ML_PER_CUP = 236.588;
const G_PER_OZ = 28.3495;

/* ------------------------------- public -------------------------------- */

/**
 * Convert an amount string to the target measurement system. Returns the
 * input unchanged when there's no leading number, no recognized
 * weight/volume unit, or the result would round to zero.
 */
export function convertAmount(
  amount: string | undefined,
  system: UnitSystem,
): string | undefined {
  if (!amount) return amount;

  const trimmed = amount.trim();
  // Leading number: int, decimal, simple fraction, or mixed fraction.
  const match = trimmed.match(
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(.*)$/,
  );
  if (!match) return amount;

  const [, numericPart, rest] = match;
  const value = parseNumeric(numericPart);
  if (value == null) return amount;

  const unit = normalizeUnit(rest);

  const grams = WEIGHT_TO_GRAMS[unit];
  if (grams != null) {
    const out =
      system === "metric"
        ? formatMetricWeight(value * grams)
        : formatImperialWeight(value * grams);
    return zeroish(out) ? amount : out;
  }

  const ml = VOLUME_TO_ML[unit];
  if (ml != null) {
    const out =
      system === "metric"
        ? formatMetricVolume(value * ml)
        : formatImperialVolume(value * ml);
    return zeroish(out) ? amount : out;
  }

  // Neutral (tsp/tbsp), count, descriptive, or unknown unit — leave as-is.
  return amount;
}

/* ------------------------------ formatting ----------------------------- */

function formatMetricWeight(g: number): string {
  if (g >= 1000) return `${trimNum(g / 1000)} kg`;
  return `${roundStep(g, g < 10 ? 1 : g < 100 ? 5 : 10)} g`;
}

function formatMetricVolume(ml: number): string {
  if (ml >= 1000) return `${trimNum(ml / 1000)} l`;
  return `${roundStep(ml, ml < 10 ? 1 : ml < 100 ? 5 : 10)} ml`;
}

function formatImperialWeight(g: number): string {
  const oz = g / G_PER_OZ;
  if (oz >= 16) return `${formatFraction(oz / 16, WEIGHT_FRACTIONS)} lb`;
  return `${formatFraction(oz, WEIGHT_FRACTIONS)} oz`;
}

function formatImperialVolume(ml: number): string {
  if (ml < ML_PER_TBSP) {
    return `${formatFraction(ml / ML_PER_TSP, VOLUME_FRACTIONS)} tsp`;
  }
  const cups = ml / ML_PER_CUP;
  // Switch to cups at a quarter-cup and up, so "1/4 cup" round-trips as
  // itself rather than the equivalent "4 tbsp".
  if (cups < 0.25) {
    return `${formatFraction(ml / ML_PER_TBSP, VOLUME_FRACTIONS)} tbsp`;
  }
  const word = snapNumeric(cups, VOLUME_FRACTIONS) > 1 ? "cups" : "cup";
  return `${formatFraction(cups, VOLUME_FRACTIONS)} ${word}`;
}

/* ------------------------------- helpers ------------------------------- */

const VOLUME_FRACTIONS: ReadonlyArray<readonly [number, string]> = [
  [1 / 8, "1/8"], [1 / 4, "1/4"], [1 / 3, "1/3"],
  [1 / 2, "1/2"], [2 / 3, "2/3"], [3 / 4, "3/4"],
];

const WEIGHT_FRACTIONS: ReadonlyArray<readonly [number, string]> = [
  [1 / 4, "1/4"], [1 / 2, "1/2"], [3 / 4, "3/4"],
];

/** Snap to the nearest whole + curated fraction, e.g. 1.31 → "1 1/3". */
function formatFraction(
  value: number,
  fractions: ReadonlyArray<readonly [number, string]>,
): string {
  const whole = Math.floor(value);
  const rem = value - whole;

  let bestLabel = ""; // remainder rounds down to the whole
  let bestWhole = whole;
  let bestDist = rem; // distance to fraction 0

  for (const [f, label] of fractions) {
    const d = Math.abs(rem - f);
    if (d < bestDist) {
      bestDist = d;
      bestLabel = label;
      bestWhole = whole;
    }
  }
  if (Math.abs(rem - 1) < bestDist) {
    bestLabel = ""; // remainder rounds up to the next whole
    bestWhole = whole + 1;
  }

  if (bestLabel === "") return `${bestWhole}`;
  return bestWhole === 0 ? bestLabel : `${bestWhole} ${bestLabel}`;
}

/** Numeric counterpart of `formatFraction` — used to decide cup pluralization. */
function snapNumeric(
  value: number,
  fractions: ReadonlyArray<readonly [number, string]>,
): number {
  const whole = Math.floor(value);
  const rem = value - whole;
  let best = 0;
  let bestDist = rem;
  for (const [f] of fractions) {
    const d = Math.abs(rem - f);
    if (d < bestDist) {
      bestDist = d;
      best = f;
    }
  }
  if (Math.abs(rem - 1) < bestDist) return whole + 1;
  return whole + best;
}

function parseNumeric(raw: string): number | null {
  if (raw.includes(" ")) {
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

/** Lowercase, drop periods, collapse whitespace — "Fl. Oz." → "fl oz". */
function normalizeUnit(rest: string): string {
  return rest.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
}

function roundStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Round to 2 decimals and strip trailing zeros: 1.5 → "1.5", 3 → "3". */
function trimNum(n: number): string {
  return Number(n.toFixed(2)).toString();
}

function zeroish(out: string): boolean {
  return out === "0" || out.startsWith("0 ");
}
