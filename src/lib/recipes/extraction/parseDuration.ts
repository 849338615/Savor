/**
 * Extract a suggested timer duration (in seconds) from an instruction's text.
 *
 * Recipe sources almost never publish per-step times in structured data — the
 * times are embedded in prose ("simmer 5 minutes", "bake 25 minutes"). This
 * module parses those mentions and picks the dominant cooking time so the
 * UI's TimerChip / cook-mode TimerDisplay can render.
 *
 * Selection rule: take the LARGEST duration in the step. The longest time
 * is almost always the cooking-action timer the user wants (e.g.
 * "simmer for 30 minutes, stirring every 5" → 30 min, not 5 min).
 *
 * Patterns supported:
 *   - simple:    "5 minutes", "30 sec", "2 hours"
 *   - mixed:     "1 1/2 hours", "1.5 hours"
 *   - ranges:    "2-3 min", "5 to 10 minutes"  (takes the high end)
 *   - combined:  "1 hour 30 minutes", "1 hr 15 mins"
 *   - units:     seconds/sec/secs, minutes/minute/min/mins, hours/hour/hr/hrs
 *
 * Single-letter units (s, m, h) intentionally excluded to avoid false
 * positives ("9-inch pan", "3 m wide", etc.).
 */

const MIN_USEFUL_SECONDS = 5;
const MAX_USEFUL_SECONDS = 24 * 60 * 60; // 24h cap kills false matches like timestamps

function unitToSeconds(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith("s")) return value;
  if (u.startsWith("m")) return value * 60;
  return value * 3600; // h
}

/**
 * Parse a number that may be a decimal ("1.5"), a fraction ("1/2"), or a
 * mixed fraction ("1 1/2"). Returns NaN if unrecognized.
 */
function parseTimeNumber(s: string): number {
  const t = s.trim();
  if (/^\d+\s+\d+\/\d+$/.test(t)) {
    const [whole, frac] = t.split(/\s+/);
    const [num, den] = frac.split("/").map(Number);
    return den ? parseInt(whole, 10) + num / den : NaN;
  }
  if (/^\d+\/\d+$/.test(t)) {
    const [num, den] = t.split("/").map(Number);
    return den ? num / den : NaN;
  }
  return parseFloat(t);
}

const NUMBER = String.raw`(?:\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)`;
const SEC_UNIT = String.raw`(?:seconds?|secs?)`;
const MIN_UNIT = String.raw`(?:minutes?|mins?)`;
const HOUR_UNIT = String.raw`(?:hours?|hrs?)`;
const ANY_UNIT = `(?:${SEC_UNIT}|${MIN_UNIT}|${HOUR_UNIT})`;

const COMBINED_RE = new RegExp(
  String.raw`\b(${NUMBER})\s*${HOUR_UNIT}\s+(?:and\s+)?(${NUMBER})\s*${MIN_UNIT}\b`,
  "gi",
);

const RANGE_RE = new RegExp(
  String.raw`\b${NUMBER}\s*(?:to|–|—|-)\s*(${NUMBER})\s*(${ANY_UNIT})\b`,
  "gi",
);

const SIMPLE_RE = new RegExp(
  String.raw`\b(${NUMBER})\s*(${ANY_UNIT})\b`,
  "gi",
);

export function extractStepDurationSeconds(text: string): number | undefined {
  if (!text) return undefined;

  const durations: number[] = [];
  let working = text;

  // Combined "X hour Y minute" first — sum and remove from working text so the
  // simple pass doesn't double-count the same span.
  working = working.replace(COMBINED_RE, (_match, h, m) => {
    const hours = parseTimeNumber(h);
    const mins = parseTimeNumber(m);
    if (Number.isFinite(hours) && Number.isFinite(mins)) {
      const seconds = hours * 3600 + mins * 60;
      if (seconds >= MIN_USEFUL_SECONDS && seconds <= MAX_USEFUL_SECONDS) {
        durations.push(seconds);
      }
    }
    return " ";
  });

  // Ranges like "5 to 10 minutes" — take the high end (safer cooking time)
  // and remove from working text.
  working = working.replace(RANGE_RE, (_match, hi, unit) => {
    const value = parseTimeNumber(hi);
    if (Number.isFinite(value)) {
      const seconds = unitToSeconds(value, unit);
      if (seconds >= MIN_USEFUL_SECONDS && seconds <= MAX_USEFUL_SECONDS) {
        durations.push(seconds);
      }
    }
    return " ";
  });

  // Simple "N units" remaining
  let m: RegExpExecArray | null;
  SIMPLE_RE.lastIndex = 0;
  while ((m = SIMPLE_RE.exec(working)) !== null) {
    const value = parseTimeNumber(m[1]);
    if (!Number.isFinite(value)) continue;
    const seconds = unitToSeconds(value, m[2]);
    if (seconds >= MIN_USEFUL_SECONDS && seconds <= MAX_USEFUL_SECONDS) {
      durations.push(seconds);
    }
  }

  if (durations.length === 0) return undefined;
  return Math.round(Math.max(...durations));
}
