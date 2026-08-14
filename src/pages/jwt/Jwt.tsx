import { useMemo, useState } from "react";
import { Check, Copy, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Jwt.module.css";

const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzAwMDAwMDAwLCJuYmYiOjE3MDAwMDAwMDAsImV4cCI6MTgwMDAwMDAwMH0." +
  "dGhpc19pc19hX2Zha2Vfc2lnbmF0dXJl";

interface DecodedJwt {
  header: string;
  payload: string;
  payloadObj: Record<string, unknown> | null;
  signature: string;
}

interface DecodeResult {
  decoded: DecodedJwt | null;
  error: string | null;
}

function base64UrlDecode(part: string): string {
  let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padNeeded = (4 - (b64.length % 4)) % 4;
  b64 += "=".repeat(padNeeded);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

function decodeJwt(token: string): DecodeResult {
  const trimmed = token.trim();
  if (trimmed === "") {
    return { decoded: null, error: null };
  }

  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    return {
      decoded: null,
      error: `Malformed token: expected 3 parts separated by ".", found ${parts.length}`,
    };
  }

  const [headerPart, payloadPart, signature] = parts;

  let headerJson: string;
  let payloadJson: string;
  try {
    headerJson = base64UrlDecode(headerPart);
  } catch {
    return { decoded: null, error: "Could not base64url-decode the header." };
  }
  try {
    payloadJson = base64UrlDecode(payloadPart);
  } catch {
    return { decoded: null, error: "Could not base64url-decode the payload." };
  }

  let headerPretty: string;
  try {
    headerPretty = JSON.stringify(JSON.parse(headerJson), null, 2);
  } catch {
    return { decoded: null, error: "Header is not valid JSON." };
  }

  let payloadObj: Record<string, unknown> | null = null;
  let payloadPretty: string;
  try {
    payloadObj = JSON.parse(payloadJson);
    payloadPretty = JSON.stringify(payloadObj, null, 2);
  } catch {
    return { decoded: null, error: "Payload is not valid JSON." };
  }

  return {
    decoded: {
      header: headerPretty,
      payload: payloadPretty,
      payloadObj,
      signature,
    },
    error: null,
  };
}

function formatUnixSeconds(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
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

export function Jwt() {
  const ready = useRevealReady();
  const [input, setInput] = useState<string>(SAMPLE);

  const { decoded, error } = useMemo(() => decodeJwt(input), [input]);

  const isEmpty = input.trim() === "";

  const expInfo = useMemo(() => {
    if (!decoded?.payloadObj) return null;
    const exp = decoded.payloadObj["exp"];
    const formatted = formatUnixSeconds(exp);
    if (formatted === null) return null;
    const isExpired = typeof exp === "number" && exp * 1000 < Date.now();
    return { formatted, isExpired };
  }, [decoded]);

  const iatFormatted = useMemo(() => {
    if (!decoded?.payloadObj) return null;
    return formatUnixSeconds(decoded.payloadObj["iat"]);
  }, [decoded]);

  const nbfFormatted = useMemo(() => {
    if (!decoded?.payloadObj) return null;
    return formatUnixSeconds(decoded.payloadObj["nbf"]);
  }, [decoded]);

  return (
    <Frame wide>
      <SectionHeading title="JWT Decoder" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.panel} variants={revealItem}>
          <div className={styles.panelHead}>
            <span className={styles.panelLabel}>Token</span>
          </div>

          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste a JWT here..."
          />

          {error && !isEmpty && (
            <div className={styles.errorMsg}>
              <AlertTriangle size={13} />
              {error}
            </div>
          )}

          <div className={styles.note}>Decode only - the signature is not verified.</div>
        </motion.div>

        <motion.div className={styles.panel} variants={revealItem}>
          <div className={styles.panelHead}>
            <span className={styles.panelLabel}>Header</span>
            <CopyButton text={decoded?.header ?? ""} />
          </div>
          <pre className={styles.pre}>{decoded?.header ?? " "}</pre>

          <div className={styles.panelHead}>
            <span className={styles.panelLabel}>Payload</span>
            <CopyButton text={decoded?.payload ?? ""} />
          </div>
          <pre className={styles.pre}>{decoded?.payload ?? " "}</pre>

          {decoded && (
            <>
              <div className={styles.panelHead}>
                <span className={styles.panelLabel}>Signature</span>
                <CopyButton text={decoded.signature} />
              </div>
              <pre className={clsx(styles.pre, styles.sigPre)}>{decoded.signature || " "}</pre>
            </>
          )}

          {(expInfo || iatFormatted || nbfFormatted) && (
            <div className={styles.claimsRow}>
              {expInfo && (
                <span
                  className={clsx(
                    styles.badge,
                    expInfo.isExpired ? styles.badgeExpired : styles.badgeValid
                  )}
                >
                  {expInfo.isExpired ? "EXPIRED" : "VALID"} &middot; exp {expInfo.formatted}
                </span>
              )}
              {nbfFormatted && (
                <span className={styles.claimItem}>
                  nbf <span className={styles.claimValue}>{nbfFormatted}</span>
                </span>
              )}
              {iatFormatted && (
                <span className={styles.claimItem}>
                  iat <span className={styles.claimValue}>{iatFormatted}</span>
                </span>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default Jwt;
