import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Check, Copy, FileUp, Upload } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Base64.module.css";

type Mode = "encode" | "decode";
type InputKind = "text" | "file";

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(b64: string): string {
  let out = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = out.length % 4;
  if (pad === 2) out += "==";
  else if (pad === 3) out += "=";
  return out;
}

function encodeText(text: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const b64 = btoa(binary);
  return urlSafe ? toUrlSafe(b64) : b64;
}

function decodeText(input: string, urlSafe: boolean): string {
  const normalized = urlSafe ? fromUrlSafe(input) : input;
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function Base64() {
  const ready = useRevealReady();
  const [mode, setMode] = useState<Mode>("encode");
  const [inputKind, setInputKind] = useState<InputKind>("text");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [urlSafe, setUrlSafe] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (inputKind !== "text") return;

    if (!input) {
      setOutput("");
      setError(null);
      return;
    }

    try {
      if (mode === "encode") {
        setOutput(encodeText(input, urlSafe));
      } else {
        setOutput(decodeText(input.trim(), urlSafe));
      }
      setError(null);
    } catch {
      setOutput("");
      setError(
        mode === "encode"
          ? "Could not encode that input."
          : "Invalid base64 input - could not decode."
      );
    }
  }, [input, mode, urlSafe, inputKind]);

  function switchMode(next: Mode) {
    setMode(next);
    setInput("");
    setOutput("");
    setError(null);
    setFileName(null);
    if (next === "decode") setInputKind("text");
  }

  const loadFile = useCallback((file: File) => {
    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onerror = () => setError("Could not read that file.");
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        setError("Could not read that file.");
        return;
      }
      setOutput(result);
    };
    reader.readAsDataURL(file);
  }, []);

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Base64" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.toolbar} variants={revealItem}>
          <div className={styles.chips}>
            <button
              type="button"
              className={clsx(styles.chip, mode === "encode" && styles.chipActive)}
              onClick={() => switchMode("encode")}
            >
              Encode
            </button>
            <button
              type="button"
              className={clsx(styles.chip, mode === "decode" && styles.chipActive)}
              onClick={() => switchMode("decode")}
            >
              Decode
            </button>
          </div>

          {mode === "encode" && (
            <div className={styles.chips}>
              <button
                type="button"
                className={clsx(styles.chip, inputKind === "text" && styles.chipActive)}
                onClick={() => setInputKind("text")}
              >
                Text
              </button>
              <button
                type="button"
                className={clsx(styles.chip, inputKind === "file" && styles.chipActive)}
                onClick={() => setInputKind("file")}
              >
                File
              </button>
            </div>
          )}

          <label className={styles.urlSafeToggle}>
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
              disabled={inputKind === "file"}
            />
            URL-safe
          </label>
        </motion.div>

        {inputKind === "text" ? (
          <motion.div className={styles.textLayout} variants={revealItem}>
            <div className={styles.panel}>
              <span className={styles.panelLabel}>
                {mode === "encode" ? "Text" : "Base64"}
              </span>
              <textarea
                className={styles.textarea}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "encode"
                    ? "Type or paste text to encode..."
                    : "Paste base64 to decode..."
                }
                spellCheck={false}
              />
            </div>

            <div className={styles.panel}>
              <div className={styles.outputHead}>
                <span className={styles.panelLabel}>
                  {mode === "encode" ? "Base64" : "Text"}
                </span>
                <button
                  type="button"
                  className={clsx(styles.copyBtn, copied && styles.copied)}
                  onClick={copyOutput}
                  disabled={!output}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              {error ? (
                <p className={styles.error}>{error}</p>
              ) : (
                <pre className={styles.pre}>{output}</pre>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div className={styles.fileLayout} variants={revealItem}>
            <div
              className={clsx(styles.dropzone, isDragging && styles.dropzoneActive)}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <Upload size={22} className={styles.dropIcon} />
              <span className={styles.dropText}>
                {fileName ?? "Drop a file or click to upload"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                className={styles.hiddenInput}
                onChange={handleFileInput}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {output ? (
              <div className={styles.panel}>
                <div className={styles.outputHead}>
                  <span className={styles.panelLabel}>Data URI</span>
                  <button
                    type="button"
                    className={clsx(styles.copyBtn, copied && styles.copied)}
                    onClick={copyOutput}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className={styles.pre}>{output}</pre>
              </div>
            ) : (
              <div className={styles.empty}>
                <FileUp size={22} className={styles.emptyIcon} />
                <span>Upload a file to get its base64 data URI.</span>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </Frame>
  );
}

export default Base64;
