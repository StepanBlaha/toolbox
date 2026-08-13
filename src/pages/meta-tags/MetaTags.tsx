import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./MetaTags.module.css";

type TwitterCard = "summary" | "summary_large_image";

const TITLE_IDEAL = 60;
const DESCRIPTION_IDEAL = 160;

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;");
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function MetaTags() {
  const ready = useRevealReady();

  const [title, setTitle] = useState("My Page Title");
  const [description, setDescription] = useState(
    "A clear, compelling summary of what this page is about, written for search results."
  );
  const [canonicalUrl, setCanonicalUrl] = useState("https://example.com/page");
  const [keywords, setKeywords] = useState("keyword one, keyword two");
  const [author, setAuthor] = useState("Jane Doe");
  const [ogImage, setOgImage] = useState("https://example.com/og-image.png");
  const [twitterCard, setTwitterCard] = useState<TwitterCard>(
    "summary_large_image"
  );
  const [themeColor, setThemeColor] = useState("#0f172a");
  const [siteName, setSiteName] = useState("Example Site");
  const [copied, setCopied] = useState(false);

  const titleOver = title.length > TITLE_IDEAL;
  const descriptionOver = description.length > DESCRIPTION_IDEAL;

  const headBlock = useMemo(() => {
    const t = escapeAttr(title);
    const d = escapeAttr(description);
    const c = escapeAttr(canonicalUrl);
    const k = escapeAttr(keywords);
    const a = escapeAttr(author);
    const img = escapeAttr(ogImage);
    const site = escapeAttr(siteName);
    const theme = escapeAttr(themeColor);

    return `<title>${t}</title>
<meta name="description" content="${d}" />
<link rel="canonical" href="${c}" />
<meta name="keywords" content="${k}" />
<meta name="author" content="${a}" />
<meta name="robots" content="index, follow" />

<!-- Open Graph -->
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:url" content="${c}" />
<meta property="og:image" content="${img}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${site}" />

<!-- Twitter -->
<meta name="twitter:card" content="${twitterCard}" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${img}" />

<meta name="theme-color" content="${theme}" />`;
  }, [
    title,
    description,
    canonicalUrl,
    keywords,
    author,
    ogImage,
    twitterCard,
    themeColor,
    siteName,
  ]);

  async function copy() {
    await navigator.clipboard.writeText(headBlock);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Meta Tag Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.formPanel} variants={revealItem}>
          <div className={styles.field}>
            <label htmlFor="title">
              Page title
              <span
                className={clsx(styles.counter, titleOver && styles.counterOver)}
              >
                {title.length}/{TITLE_IDEAL}
              </span>
            </label>
            <input
              id="title"
              type="text"
              className={styles.textInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">
              Description
              <span
                className={clsx(
                  styles.counter,
                  descriptionOver && styles.counterOver
                )}
              >
                {description.length}/{DESCRIPTION_IDEAL}
              </span>
            </label>
            <textarea
              id="description"
              className={styles.textarea}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="canonicalUrl">Canonical URL</label>
              <input
                id="canonicalUrl"
                type="text"
                className={styles.textInput}
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="siteName">Site name</label>
              <input
                id="siteName"
                type="text"
                className={styles.textInput}
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="keywords">Keywords</label>
              <input
                id="keywords"
                type="text"
                className={styles.textInput}
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="author">Author</label>
              <input
                id="author"
                type="text"
                className={styles.textInput}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="ogImage">og:image URL</label>
            <input
              id="ogImage"
              type="text"
              className={styles.textInput}
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="twitterCard">Twitter card type</label>
              <select
                id="twitterCard"
                className={styles.select}
                value={twitterCard}
                onChange={(e) => setTwitterCard(e.target.value as TwitterCard)}
              >
                <option value="summary">summary</option>
                <option value="summary_large_image">
                  summary_large_image
                </option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="themeColor">Theme color</label>
              <div className={styles.colorRow}>
                <input
                  id="themeColor"
                  type="color"
                  className={styles.colorInput}
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div className={styles.serpBlock}>
            <span className={styles.serpLabel}>Google SERP preview</span>
            <div className={styles.serpCard}>
              <div className={styles.serpUrl}>{displayUrl(canonicalUrl)}</div>
              <div className={styles.serpTitle}>
                {truncate(title, TITLE_IDEAL)}
              </div>
              <div className={styles.serpDescription}>
                {truncate(description, DESCRIPTION_IDEAL)}
              </div>
            </div>
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>HTML output</span>
              <button
                type="button"
                className={clsx(styles.copyBtn, copied && styles.copied)}
                onClick={copy}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className={styles.pre}>{headBlock}</pre>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default MetaTags;
