import { motion } from "framer-motion";
import styles from "./SectionHeading.module.css";

export default function SectionHeading({
  title,
  count,
  level = "h1",
}: {
  title: string;
  count?: number;
  /** Heading level for semantics/SEO. Tool pages default to h1 (their main
   *  title); the landing passes "h2" since its h1 is the "toolbox" wordmark. */
  level?: "h1" | "h2";
}) {
  const Heading = level === "h2" ? motion.h2 : motion.h1;
  return (
    <div className={styles.head}>
      <Heading
        className={styles.title}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {title}
        {count !== undefined && <sup className={styles.count}>({count})</sup>}
      </Heading>
      <span className={styles.rule} aria-hidden />
    </div>
  );
}

export { SectionHeading };
