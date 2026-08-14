import { useState } from "react";
import { Check, Copy, Lock, Unlock } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Aes.module.css";

type Mode = "encrypt" | "decrypt";

const PBKDF2_ITERATIONS = 150_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase) as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptMessage(
  passphrase: string,
  message: string
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    encoder.encode(message) as BufferSource
  );

  const combined = new Uint8Array(
    salt.length + iv.length + ciphertext.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return bytesToBase64(combined);
}

async function decryptMessage(
  passphrase: string,
  packed: string
): Promise<string> {
  const combined = base64ToBytes(packed);
  if (combined.length < SALT_LENGTH + IV_LENGTH) {
    throw new Error("Input too short");
  }
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);
  const key = await deriveKey(passphrase, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );
  const decoder = new TextDecoder();
  return decoder.decode(plainBuffer);
}

export function Aes() {
  const ready = useRevealReady();
  const [mode, setMode] = useState<Mode>("encrypt");
  const [passphrase, setPassphrase] = useState("");
  const [message, setMessage] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  async function run() {
    setError("");
    setOutput("");
    if (!passphrase || !message) {
      setError("Enter a passphrase and a message.");
      return;
    }

    setWorking(true);
    try {
      if (mode === "encrypt") {
        const result = await encryptMessage(passphrase, message);
        setOutput(result);
      } else {
        const result = await decryptMessage(passphrase, message.trim());
        setOutput(result);
      }
    } catch {
      if (mode === "decrypt") {
        setError("Decryption failed - wrong passphrase or corrupted input");
      } else {
        setError("Encryption failed. Please try again.");
      }
    } finally {
      setWorking(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setOutput("");
    setError("");
  }

  function useOutputAsInput() {
    const nextMode: Mode = mode === "encrypt" ? "decrypt" : "encrypt";
    setMode(nextMode);
    setMessage(output);
    setOutput("");
    setError("");
  }

  return (
    <Frame wide>
      <SectionHeading title="AES Encrypt" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.modeRow}>
            <button
              type="button"
              className={clsx(styles.modeBtn, mode === "encrypt" && styles.modeBtnActive)}
              onClick={() => switchMode("encrypt")}
            >
              <Lock size={13} />
              Encrypt
            </button>
            <button
              type="button"
              className={clsx(styles.modeBtn, mode === "decrypt" && styles.modeBtnActive)}
              onClick={() => switchMode("decrypt")}
            >
              <Unlock size={13} />
              Decrypt
            </button>
          </div>

          <div className={styles.field}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              className={styles.textInput}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter a strong passphrase"
              autoComplete="off"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="message">
              {mode === "encrypt" ? "Message" : "Ciphertext (base64)"}
            </label>
            <textarea
              id="message"
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                mode === "encrypt"
                  ? "Type the message to encrypt..."
                  : "Paste the base64 ciphertext to decrypt..."
              }
              rows={6}
            />
          </div>

          <button
            type="button"
            className={styles.runBtn}
            onClick={() => void run()}
            disabled={working}
          >
            {mode === "encrypt" ? <Lock size={13} /> : <Unlock size={13} />}
            {working
              ? "Working..."
              : mode === "encrypt"
              ? "Encrypt"
              : "Decrypt"}
          </button>

          <p className={styles.note}>
            AES-GCM 256, PBKDF2-SHA256. Runs entirely in your browser -
            nothing is sent anywhere.
          </p>
        </motion.div>

        <motion.div className={styles.resultPanel} variants={revealItem}>
          <div className={styles.resultHead}>
            <span className={styles.resultTitle}>Result</span>
            {output && (
              <button
                type="button"
                className={clsx(styles.copyBtn, copied && styles.copied)}
                onClick={() => void copy()}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>

          {error ? (
            <p className={styles.errorNote}>{error}</p>
          ) : output ? (
            <pre className={styles.pre}>{output}</pre>
          ) : (
            <div className={styles.emptyState}>
              Your {mode === "encrypt" ? "encrypted" : "decrypted"} text will
              appear here.
            </div>
          )}

          {output && !error && (
            <button
              type="button"
              className={styles.swapBtn}
              onClick={useOutputAsInput}
            >
              {mode === "encrypt" ? (
                <>
                  <Unlock size={13} />
                  Decrypt this →
                </>
              ) : (
                <>
                  <Lock size={13} />
                  Encrypt this →
                </>
              )}
            </button>
          )}
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default Aes;
