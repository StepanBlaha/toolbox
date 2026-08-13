import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Timestamp.module.css";

const ZONES: { label: string; zone: string }[] = [
  { label: "UTC", zone: "UTC" },
  { label: "New York", zone: "America/New_York" },
  { label: "London", zone: "Europe/London" },
  { label: "Prague", zone: "Europe/Prague" },
  { label: "Tokyo", zone: "Asia/Tokyo" },
];

const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 31536000 },
  { unit: "month", seconds: 2592000 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 },
];

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function formatRelative(fromMs: number, toMs: number): string {
  const diffSeconds = (toMs - fromMs) / 1000;
  const absSeconds = Math.abs(diffSeconds);

  for (const { unit, seconds } of RELATIVE_UNITS) {
    if (absSeconds >= seconds || unit === "second") {
      const value = Math.round(diffSeconds / seconds) * -1;
      return relativeFormatter.format(value, unit);
    }
  }
  return relativeFormatter.format(0, "second");
}

function formatInZone(date: Date, zone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface CopyRowProps {
  label: string;
  value: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}

function CopyRow({ label, value, copyKey, copiedKey, onCopy }: CopyRowProps) {
  const isCopied = copiedKey === copyKey;
  return (
    <div className={styles.outputRow}>
      <div className={styles.outputText}>
        <span className={styles.outputLabel}>{label}</span>
        <span className={styles.outputValue}>{value}</span>
      </div>
      <button
        type="button"
        className={clsx(styles.copyBtn, isCopied && styles.copied)}
        onClick={() => onCopy(copyKey, value)}
      >
        {isCopied ? <Check size={13} /> : <Copy size={13} />}
        {isCopied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function Timestamp() {
  const ready = useRevealReady();
  const [now, setNow] = useState<Date>(new Date());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [unixInput, setUnixInput] = useState<string>(() =>
    String(Math.floor(Date.now() / 1000))
  );
  const [humanInput, setHumanInput] = useState<string>(() =>
    toDatetimeLocalValue(new Date())
  );

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  function onCopy(key: string, value: string) {
    void navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
  }

  const parsedUnixMs = useMemo<number | null>(() => {
    const trimmed = unixInput.trim();
    if (trimmed === "" || !/^-?\d+$/.test(trimmed)) return null;
    const num = Number(trimmed);
    if (!Number.isFinite(num)) return null;
    // auto-detect seconds vs milliseconds by digit length
    const digits = trimmed.replace("-", "").length;
    return digits > 10 ? num : num * 1000;
  }, [unixInput]);

  const unixDate = useMemo(
    () => (parsedUnixMs !== null ? new Date(parsedUnixMs) : null),
    [parsedUnixMs]
  );
  const unixDateValid = unixDate !== null && !Number.isNaN(unixDate.getTime());

  const humanDate = useMemo<Date | null>(() => {
    if (!humanInput) return null;
    const d = new Date(humanInput);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [humanInput]);

  const activeZoneDate = unixDateValid ? unixDate : humanDate;

  return (
    <Frame wide>
      <SectionHeading title="Timestamp Converter" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.panel} variants={revealItem}>
          <span className={styles.panelTitle}>Current Unix time</span>
          <div className={styles.liveRow}>
            <span className={styles.liveValue}>{Math.floor(now.getTime() / 1000)}</span>
            <span className={styles.liveUnit}>seconds</span>
          </div>
          <div className={styles.liveRow}>
            <span className={styles.liveValue}>{now.getTime()}</span>
            <span className={styles.liveUnit}>milliseconds</span>
          </div>
          <button
            type="button"
            className={clsx(styles.copyBtn, copiedKey === "live" && styles.copied)}
            onClick={() => onCopy("live", String(Math.floor(now.getTime() / 1000)))}
          >
            {copiedKey === "live" ? <Check size={13} /> : <Copy size={13} />}
            {copiedKey === "live" ? "Copied" : "Copy seconds"}
          </button>
        </motion.div>

        <motion.div className={styles.panel} variants={revealItem}>
          <span className={styles.panelTitle}>Unix &rarr; Human</span>
          <div className={styles.field}>
            <label htmlFor="unixInput">Unix timestamp</label>
            <input
              id="unixInput"
              type="text"
              inputMode="numeric"
              className={styles.textInput}
              value={unixInput}
              onChange={(e) => setUnixInput(e.target.value)}
              placeholder="e.g. 1700000000"
            />
          </div>

          {unixDateValid ? (
            <div className={styles.outputs}>
              <CopyRow
                label="Local date/time"
                value={unixDate.toString()}
                copyKey="unix-local"
                copiedKey={copiedKey}
                onCopy={onCopy}
              />
              <CopyRow
                label="UTC (ISO 8601)"
                value={unixDate.toISOString()}
                copyKey="unix-iso"
                copiedKey={copiedKey}
                onCopy={onCopy}
              />
              <CopyRow
                label="Relative"
                value={formatRelative(unixDate.getTime(), Date.now())}
                copyKey="unix-relative"
                copiedKey={copiedKey}
                onCopy={onCopy}
              />
              <CopyRow
                label="Day of week"
                value={new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
                  unixDate
                )}
                copyKey="unix-dow"
                copiedKey={copiedKey}
                onCopy={onCopy}
              />
            </div>
          ) : (
            <p className={styles.hint}>Enter a valid Unix timestamp (seconds or milliseconds).</p>
          )}
        </motion.div>

        <motion.div className={styles.panel} variants={revealItem}>
          <span className={styles.panelTitle}>Human &rarr; Unix</span>
          <div className={styles.field}>
            <label htmlFor="humanInput">Date &amp; time</label>
            <input
              id="humanInput"
              type="datetime-local"
              className={styles.textInput}
              value={humanInput}
              onChange={(e) => setHumanInput(e.target.value)}
            />
          </div>

          {humanDate ? (
            <div className={styles.outputs}>
              <CopyRow
                label="Unix seconds"
                value={String(Math.floor(humanDate.getTime() / 1000))}
                copyKey="human-sec"
                copiedKey={copiedKey}
                onCopy={onCopy}
              />
              <CopyRow
                label="Unix milliseconds"
                value={String(humanDate.getTime())}
                copyKey="human-ms"
                copiedKey={copiedKey}
                onCopy={onCopy}
              />
              <CopyRow
                label="ISO 8601"
                value={humanDate.toISOString()}
                copyKey="human-iso"
                copiedKey={copiedKey}
                onCopy={onCopy}
              />
            </div>
          ) : (
            <p className={styles.hint}>Enter a valid date and time.</p>
          )}
        </motion.div>

        <motion.div className={styles.panel} variants={revealItem}>
          <span className={styles.panelTitle}>Timezones</span>
          {activeZoneDate ? (
            <div className={styles.outputs}>
              {ZONES.map(({ label, zone }) => (
                <CopyRow
                  key={zone}
                  label={label}
                  value={formatInZone(activeZoneDate, zone)}
                  copyKey={`zone-${zone}`}
                  copiedKey={copiedKey}
                  onCopy={onCopy}
                />
              ))}
            </div>
          ) : (
            <p className={styles.hint}>
              Enter a value above to see it across timezones.
            </p>
          )}
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default Timestamp;
export { Timestamp };
