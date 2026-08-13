import { motion } from "framer-motion";
import styles from "./SectionHeading.module.css";

export default function SectionHeading({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <div className={styles.head}>
      <motion.h2
        className={styles.title}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {title}
        {count !== undefined && <sup className={styles.count}>({count})</sup>}
      </motion.h2>
      <span className={styles.rule} aria-hidden />
    </div>
  );
}

export { SectionHeading };
