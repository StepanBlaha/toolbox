import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Cron.module.css";

interface FieldSpec {
  key: "minute" | "hour" | "dom" | "month" | "dow";
  label: string;
  min: number;
  max: number;
}

const FIELDS: FieldSpec[] = [
  { key: "minute", label: "minute", min: 0, max: 59 },
  { key: "hour", label: "hour", min: 0, max: 23 },
  { key: "dom", label: "day-of-month", min: 1, max: 31 },
  { key: "month", label: "month", min: 1, max: 12 },
  { key: "dow", label: "day-of-week", min: 0, max: 6 },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface FieldParseResult {
  ok: boolean;
  error?: string;
  matches: (value: number) => boolean;
  // description helpers
  isWildcard: boolean;
  step?: number;
  singleValue?: number;
  values?: number[];
}

const MAX_ITERATIONS = 500_000;

function parseField(raw: string, spec: FieldSpec): FieldParseResult {
  const text = raw.trim();

  if (text === "") {
    return {
      ok: false,
      error: `${spec.label} field is empty`,
      matches: () => false,
      isWildcard: false,
    };
  }

  if (text === "*") {
    return { ok: true, matches: () => true, isWildcard: true };
  }

  // */n step
  const stepMatch = text.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const step = Number(stepMatch[1]);
    if (step <= 0) {
      return {
        ok: false,
        error: `${spec.label}: step must be greater than 0`,
        matches: () => false,
        isWildcard: false,
      };
    }
    return {
      ok: true,
      matches: (v) => (v - spec.min) % step === 0,
      isWildcard: false,
      step,
    };
  }

  // list of comma-separated items, each a number or range
  const parts = text.split(",").map((p) => p.trim());
  const collected = new Set<number>();

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const a = Number(rangeMatch[1]);
      const b = Number(rangeMatch[2]);
      if (
        !Number.isInteger(a) ||
        !Number.isInteger(b) ||
        a < spec.min ||
        b > spec.max ||
        a > b
      ) {
        return {
          ok: false,
          error: `${spec.label}: invalid range "${part}" (expected ${spec.min}-${spec.max})`,
          matches: () => false,
          isWildcard: false,
        };
      }
      for (let v = a; v <= b; v++) collected.add(v);
      continue;
    }

    const numMatch = part.match(/^(\d+)$/);
    if (numMatch) {
      const n = Number(numMatch[1]);
      if (!Number.isInteger(n) || n < spec.min || n > spec.max) {
        return {
          ok: false,
          error: `${spec.label}: value "${part}" out of range (expected ${spec.min}-${spec.max})`,
          matches: () => false,
          isWildcard: false,
        };
      }
      collected.add(n);
      continue;
    }

    return {
      ok: false,
      error: `${spec.label}: could not parse "${part}"`,
      matches: () => false,
      isWildcard: false,
    };
  }

  const values = Array.from(collected).sort((a, b) => a - b);
  if (values.length === 0) {
    return {
      ok: false,
      error: `${spec.label}: no valid values found`,
      matches: () => false,
      isWildcard: false,
    };
  }

  return {
    ok: true,
    matches: (v) => collected.has(v),
    isWildcard: false,
    singleValue: values.length === 1 ? values[0] : undefined,
    values,
  };
}

interface ParsedCron {
  ok: boolean;
  errors: string[];
  fields: Record<FieldSpec["key"], FieldParseResult> | null;
}

function parseCron(expr: string): ParsedCron {
  const trimmed = expr.trim();
  const parts = trimmed.length > 0 ? trimmed.split(/\s+/) : [];

  if (parts.length !== 5) {
    return {
      ok: false,
      errors: [
        `Expected 5 fields (minute hour day-of-month month day-of-week), got ${parts.length}`,
      ],
      fields: null,
    };
  }

  const errors: string[] = [];
  const fields = {} as Record<FieldSpec["key"], FieldParseResult>;

  FIELDS.forEach((spec, idx) => {
    const result = parseField(parts[idx], spec);
    fields[spec.key] = result;
    if (!result.ok && result.error) errors.push(result.error);
  });

  return { ok: errors.length === 0, errors, fields };
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function describeField(
  result: FieldParseResult,
  kind: "minute" | "hour" | "dom" | "month" | "dow"
): string {
  if (result.isWildcard) return "*";
  if (result.step !== undefined) return `every ${result.step} ${plural(kind)}`;
  if (result.singleValue !== undefined) {
    if (kind === "month") return MONTH_NAMES[result.singleValue - 1];
    if (kind === "dow") return DAY_NAMES[result.singleValue];
    return String(result.singleValue);
  }
  if (result.values) {
    const names =
      kind === "month"
        ? result.values.map((v) => MONTH_NAMES[v - 1])
        : kind === "dow"
        ? result.values.map((v) => DAY_NAMES[v])
        : result.values.map(String);
    return names.join(", ");
  }
  return "?";
}

function plural(kind: string): string {
  switch (kind) {
    case "minute":
      return "minutes";
    case "hour":
      return "hours";
    case "dom":
      return "days";
    case "month":
      return "months";
    case "dow":
      return "days";
    default:
      return kind;
  }
}

function describeCron(fields: Record<FieldSpec["key"], FieldParseResult>): string {
  const { minute, hour, dom, month, dow } = fields;

  const domWild = dom.isWildcard;
  const dowWild = dow.isWildcard;
  const monthWild = month.isWildcard;

  // Every minute
  if (
    minute.isWildcard &&
    hour.isWildcard &&
    domWild &&
    monthWild &&
    dowWild
  ) {
    return "Every minute";
  }

  // */n minute step, everything else wildcard
  if (
    minute.step !== undefined &&
    hour.isWildcard &&
    domWild &&
    monthWild &&
    dowWild
  ) {
    return `Every ${minute.step} minutes`;
  }

  // Hourly at minute X
  if (
    minute.singleValue !== undefined &&
    hour.isWildcard &&
    domWild &&
    monthWild &&
    dowWild
  ) {
    return `At minute ${minute.singleValue} past every hour`;
  }

  // */n hour step at fixed minute
  if (
    minute.singleValue !== undefined &&
    hour.step !== undefined &&
    domWild &&
    monthWild &&
    dowWild
  ) {
    return `At minute ${minute.singleValue} past every ${hour.step} hours`;
  }

  // Fixed time daily
  if (
    minute.singleValue !== undefined &&
    hour.singleValue !== undefined &&
    domWild &&
    monthWild &&
    dowWild
  ) {
    const time = `${pad2(hour.singleValue)}:${pad2(minute.singleValue)}`;
    return `At ${time} every day`;
  }

  // Fixed time on specific day(s) of week
  if (
    minute.singleValue !== undefined &&
    hour.singleValue !== undefined &&
    domWild &&
    monthWild &&
    !dowWild
  ) {
    const time = `${pad2(hour.singleValue)}:${pad2(minute.singleValue)}`;
    const days = describeField(dow, "dow");
    const label =
      dow.singleValue !== undefined ? `on ${days}` : `on ${days}`;
    return `At ${time} ${label}`;
  }

  // Fixed time on specific day(s) of month
  if (
    minute.singleValue !== undefined &&
    hour.singleValue !== undefined &&
    !domWild &&
    monthWild &&
    dowWild
  ) {
    const time = `${pad2(hour.singleValue)}:${pad2(minute.singleValue)}`;
    const days = describeField(dom, "dom");
    return `At ${time} on day ${days} of the month`;
  }

  // Fixed time on specific month(s) and day of month
  if (
    minute.singleValue !== undefined &&
    hour.singleValue !== undefined &&
    !domWild &&
    !monthWild &&
    dowWild
  ) {
    const time = `${pad2(hour.singleValue)}:${pad2(minute.singleValue)}`;
    const days = describeField(dom, "dom");
    const months = describeField(month, "month");
    return `At ${time} on day ${days} of ${months}`;
  }

  // Fallback: describe each field individually
  const minutePart = minute.isWildcard
    ? "every minute"
    : minute.step !== undefined
    ? `every ${minute.step} minutes`
    : `at minute ${describeField(minute, "minute")}`;

  const hourPart = hour.isWildcard
    ? "every hour"
    : hour.step !== undefined
    ? `every ${hour.step} hours`
    : `hour ${describeField(hour, "hour")}`;

  const domPart = domWild
    ? "every day of the month"
    : `day-of-month ${describeField(dom, "dom")}`;

  const monthPart = monthWild
    ? "every month"
    : `month ${describeField(month, "month")}`;

  const dowPart = dowWild
    ? "every day of the week"
    : `weekday ${describeField(dow, "dow")}`;

  return `${minutePart}, ${hourPart}, ${domPart}, ${monthPart}, ${dowPart}`;
}

function computeNextRuns(
  fields: Record<FieldSpec["key"], FieldParseResult>,
  count = 5
): Date[] {
  const results: Date[] = [];
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + 1);

  const cursor = new Date(start);

  for (let i = 0; i < MAX_ITERATIONS && results.length < count; i++) {
    const minute = cursor.getMinutes();
    const hour = cursor.getHours();
    const dom = cursor.getDate();
    const month = cursor.getMonth() + 1;
    const dow = cursor.getDay();

    if (
      fields.minute.matches(minute) &&
      fields.hour.matches(hour) &&
      fields.dom.matches(dom) &&
      fields.month.matches(month) &&
      fields.dow.matches(dow)
    ) {
      results.push(new Date(cursor));
    }

    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return results;
}

interface Preset {
  label: string;
  expr: string;
}

const PRESETS: Preset[] = [
  { label: "Every minute", expr: "* * * * *" },
  { label: "Every 15 min", expr: "*/15 * * * *" },
  { label: "Hourly", expr: "0 * * * *" },
  { label: "Daily 9am", expr: "0 9 * * *" },
  { label: "Weekly Mon", expr: "0 9 * * 1" },
  { label: "Monthly", expr: "0 0 1 * *" },
];

export function Cron() {
  const ready = useRevealReady();
  const [expr, setExpr] = useState("*/15 * * * *");
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseCron(expr), [expr]);

  const explanation = useMemo(() => {
    if (!parsed.ok || !parsed.fields) return null;
    return describeCron(parsed.fields);
  }, [parsed]);

  const nextRuns = useMemo(() => {
    if (!parsed.ok || !parsed.fields) return [];
    return computeNextRuns(parsed.fields, 5);
  }, [parsed]);

  async function copy() {
    await navigator.clipboard.writeText(expr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Cron Helper" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.panel} variants={revealItem}>
          <div className={styles.field}>
            <label htmlFor="cron-input">Cron expression</label>
            <div className={styles.inputRow}>
              <input
                id="cron-input"
                type="text"
                className={clsx(
                  styles.textInput,
                  !parsed.ok && styles.invalid
                )}
                value={expr}
                onChange={(e) => setExpr(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
              <button
                type="button"
                className={clsx(styles.copyBtn, copied && styles.copied)}
                onClick={copy}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {!parsed.ok && (
              <div className={styles.errorNote}>
                {parsed.errors.map((err) => (
                  <div key={err}>{err}</div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.presets}>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={clsx(
                  styles.chip,
                  expr === preset.expr && styles.chipActive
                )}
                onClick={() => setExpr(preset.expr)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className={styles.fieldsGrid}>
            {FIELDS.map((spec) => (
              <div key={spec.key} className={styles.fieldChip}>
                <span className={styles.fieldChipLabel}>{spec.label}</span>
                <span className={styles.fieldChipValue}>
                  {expr.trim().split(/\s+/)[FIELDS.indexOf(spec)] ?? ""}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className={styles.panel} variants={revealItem}>
          <div className={styles.outputBlock}>
            <span className={styles.outputLabel}>Explanation</span>
            <div className={styles.explanation}>
              {explanation ?? "Fix the errors above to see an explanation."}
            </div>
          </div>

          <div className={styles.outputBlock}>
            <span className={styles.outputLabel}>Next 5 runs</span>
            {parsed.ok ? (
              nextRuns.length > 0 ? (
                <ol className={styles.runsList}>
                  {nextRuns.map((run) => (
                    <li key={run.getTime()} className={styles.runItem}>
                      {run.toLocaleString()}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className={styles.explanation}>
                  No matching run found within the search window.
                </div>
              )
            ) : (
              <div className={styles.explanation}>
                Fix the errors above to compute upcoming run times.
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default Cron;
