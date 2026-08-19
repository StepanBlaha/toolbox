import { useCallback, useRef, useState } from "react";
import HoverPreview from "../HoverPreview/HoverPreview";
import styles from "./SiteFooter.module.css";

const NAME = "Štěpán Bláha";
const LOCATION = "Prague, Czech Republic";
const GITHUB = "https://github.com/StepanBlaha/toolbox";
const SITE = "https://www.stepanblaha.com";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  const [hearts, setHearts] = useState<number[]>([]);
  const idRef = useRef(0);

  const burst = useCallback(() => {
    const id = idRef.current++;
    setHearts((h) => [...h, id]);
  }, []);

  const removeHeart = useCallback((id: number) => {
    setHearts((h) => h.filter((x) => x !== id));
  }, []);

  return (
    <footer className={styles.footer}>
      <p className={styles.line}>
        Designed with{" "}
        <button
          type="button"
          className={styles.heart}
          aria-label="love"
          onClick={burst}
        >
          <span className={styles.heartEmoji}>❤️</span>
          {hearts.map((id) => (
            <span
              key={id}
              className={styles.particle}
              style={{
                ["--dx" as unknown as string]: `${Math.round(
                  Math.random() * 40 - 20
                )}px`,
              }}
              onAnimationEnd={() => removeHeart(id)}
            >
              ❤️
            </span>
          ))}
        </button>{" "}
        by{" "}
        <HoverPreview
          mode="corner"
          tilt={30}
          previewWidth={150}
          previewHeight={112}
          image="/me-preview.jpg"
          alt={NAME}
          href={SITE}
          className={styles.hl}
        >
          {NAME}
        </HoverPreview>
      </p>
      <p className={styles.line}>
        Built by a human. The source code is available on{" "}
        <a href={GITHUB} target="_blank" rel="noreferrer" className={styles.link}>
          GitHub
        </a>
        .
      </p>

      <div className={styles.meta}>
        <a href="/llms.txt" className={styles.metaItem}>
          llms.txt
        </a>
        <span className={styles.metaSep} />
        <span className={styles.metaItem}>© {year}</span>
        <span className={styles.metaSep} />
        <span className={styles.metaItem}>{LOCATION}</span>
      </div>
    </footer>
  );
}
