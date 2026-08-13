import styles from "./GridFrame.module.css";

export default function GridFrame() {
  return (
    <div className={styles.frame} aria-hidden>
      <span className={styles.glow} />
    </div>
  );
}
