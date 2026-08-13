import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import styles from "./TopNav.module.css";

// lucide-react@1.x (pinned in this project) ships no brand/social icons,
// so the GitHub mark is inlined here to match the portfolio's icon size/props.
function GithubIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.4-.4-3.2 1.3a11.1 11.1 0 0 0-5.8 0c-1.8-1.7-3.2-1.3-3.2-1.3a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 5 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
    </svg>
  );
}

export default function TopNav({
  theme,
  onToggle,
}: {
  theme: string;
  onToggle: (e?: MouseEvent) => void;
}) {
  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.brand} aria-label="SB toolbox - home">
        <span className={styles.mark}>SB toolbox</span>
      </Link>

      <div className={styles.right}>
        <a
          href="https://github.com/StepanBlaha"
          target="_blank"
          rel="noreferrer"
          className={styles.icon}
          aria-label="GitHub"
        >
          <GithubIcon size={17} />
        </a>

        <span className={styles.divider} />

        <button
          className={styles.icon}
          type="button"
          onClick={(e) => onToggle(e)}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
        </button>
      </div>
    </nav>
  );
}
