import { useMemo, useState } from "react";
import { Check, Copy, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./UrlTool.module.css";

const SAMPLE_TEXT = "https://example.com/search?q=hello world&lang=en";

const SAMPLE_URL =
  "https://user:pass@www.example.com:8443/path/to/page?q=hello%20world&tag=react&tag=vite#section-2";

type EncodeOp = "encodeURIComponent" | "decodeURIComponent" | "encodeURI" | "decodeURI";

const OPS: { id: EncodeOp; label: string }[] = [
  { id: "encodeURIComponent", label: "encodeURIComponent" },
  { id: "decodeURIComponent", label: "decodeURIComponent" },
  { id: "encodeURI", label: "encodeURI" },
  { id: "decodeURI", label: "decodeURI" },
];

interface EncodeResult {
  output: string;
  error: string | null;
}

function runOp(op: EncodeOp, input: string): EncodeResult {
  try {
    switch (op) {
      case "encodeURIComponent":
        return { output: encodeURIComponent(input), error: null };
      case "decodeURIComponent":
        return { output: decodeURIComponent(input), error: null };
      case "encodeURI":
        return { output: encodeURI(input), error: null };
      case "decodeURI":
        return { output: decodeURI(input), error: null };
    }
  } catch {
    return { output: "", error: `Could not run ${op} on this input - malformed escape sequence.` };
  }
}

interface ParsedUrlFields {
  label: string;
  value: string;
}

interface ParseResult {
  fields: ParsedUrlFields[];
  params: { key: string; value: string }[];
  error: string | null;
}

function parseUrl(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { fields: [], params: [], error: null };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { fields: [], params: [], error: "Not a valid URL - include the protocol, e.g. https://" };
  }

  const fields: ParsedUrlFields[] = [
    { label: "protocol", value: url.protocol },
    { label: "host", value: url.host },
    { label: "hostname", value: url.hostname },
    { label: "port", value: url.port || "(default)" },
    { label: "pathname", value: url.pathname },
    { label: "search", value: url.search || "(none)" },
    { label: "hash", value: url.hash || "(none)" },
    { label: "origin", value: url.origin },
  ];

  const params: { key: string; value: string }[] = [];
  url.searchParams.forEach((value, key) => {
    params.push({ key, value });
  });

  return { fields, params, error: null };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      className={clsx(styles.copyBtn, copied && styles.copied)}
      onClick={copy}
      disabled={!text}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function UrlTool() {
  const ready = useRevealReady();

  const [text, setText] = useState<string>(SAMPLE_TEXT);
  const [op, setOp] = useState<EncodeOp>("encodeURIComponent");

  const [urlInput, setUrlInput] = useState<string>(SAMPLE_URL);

  const { output, error } = useMemo(() => runOp(op, text), [op, text]);
  const { fields, params, error: parseError } = useMemo(() => parseUrl(urlInput), [urlInput]);

  return (
    <Frame wide>
      <SectionHeading title="URL Tools" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.panel} variants={revealItem}>
          <div className={styles.panelHead}>
            <span className={styles.panelLabel}>Encode / Decode</span>
          </div>

          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder="Type or paste text / a URL to encode or decode..."
          />

          <div className={styles.chipRow}>
            {OPS.map((o) => (
              <button
                key={o.id}
                type="button"
                className={clsx(styles.chip, op === o.id && styles.chipActive)}
                onClick={() => setOp(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>

          {error && (
            <div className={styles.errorMsg}>
              <AlertTriangle size={13} />
              {error}
            </div>
          )}

          <div className={styles.outputBlock}>
            <div className={styles.panelHead}>
              <span className={styles.panelLabel}>Output</span>
              <CopyButton text={output} />
            </div>
            <pre className={styles.pre}>{output || " "}</pre>
          </div>
        </motion.div>

        <motion.div className={styles.panel} variants={revealItem}>
          <div className={styles.panelHead}>
            <span className={styles.panelLabel}>Parse URL</span>
          </div>

          <input
            type="text"
            className={styles.urlInput}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            spellCheck={false}
            placeholder="https://example.com/path?query=value"
          />

          {parseError && (
            <div className={styles.errorMsg}>
              <AlertTriangle size={13} />
              {parseError}
            </div>
          )}

          {fields.length > 0 && (
            <div className={styles.fieldRows}>
              {fields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                  <CopyButton text={f.value} />
                </div>
              ))}
            </div>
          )}

          {fields.length > 0 && (
            <div className={styles.outputBlock}>
              <div className={styles.panelHead}>
                <span className={styles.panelLabel}>
                  Query params <span className={styles.count}>({params.length})</span>
                </span>
              </div>

              {params.length === 0 ? (
                <div className={styles.note}>No query parameters.</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th>Value</th>
                        <th aria-label="Copy" />
                      </tr>
                    </thead>
                    <tbody>
                      {params.map((p, idx) => (
                        <tr key={`${p.key}-${idx}`}>
                          <td className={styles.tdMono}>{p.key}</td>
                          <td className={styles.tdMono}>{p.value}</td>
                          <td className={styles.tdCopy}>
                            <CopyButton text={p.value} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default UrlTool;
