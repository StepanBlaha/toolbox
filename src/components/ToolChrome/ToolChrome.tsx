import { useLocation, Link } from "react-router-dom";
import { Share2, ExternalLink } from "lucide-react";
import { tools } from "../../data/tools";
import { toolMeta } from "../../data/toolMeta";
import { useToast } from "../../context/ToastContext";
import styles from "./ToolChrome.module.css";

export function ToolChrome() {
  const location = useLocation();
  const toast = useToast();

  const match = location.pathname.match(/^\/tools\/([^/]+)\/?$/);
  const slug = match?.[1];
  const tool = slug ? tools.find((t) => t.slug === slug) : undefined;
  const meta = slug ? toolMeta[slug] : undefined;

  if (!tool || !meta) return null;

  const relatedTools = meta.related
    .map((relSlug) => tools.find((t) => t.slug === relSlug))
    .filter((t): t is (typeof tools)[number] => Boolean(t));

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Link copied");
    } catch {
      // clipboard unavailable; silently ignore
    }
  };

  return (
    <div className={styles.chrome}>
      <div className={styles.topRow}>
        <p className={styles.about}>{meta.about}</p>
        <button type="button" className={styles.shareButton} onClick={handleShare}>
          <Share2 size={14} strokeWidth={1.75} />
          Share
        </button>
      </div>

      {relatedTools.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.heading}>Related tools</h2>
          <div className={styles.chipRow}>
            {relatedTools.map((rt) => (
              <Link key={rt.slug} to={rt.path} className={styles.chip}>
                {rt.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {meta.alternatives.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.heading}>Also available elsewhere</h2>
          <div className={styles.chipRow}>
            {meta.alternatives.map((alt) => (
              <a
                key={alt.url}
                href={alt.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.chip}
              >
                {alt.label}
                <ExternalLink size={12} strokeWidth={1.75} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ToolChrome;
