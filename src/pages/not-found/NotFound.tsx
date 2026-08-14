import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Frame } from "../../components/Frame/Frame";
import { revealContainer, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./NotFound.module.css";

export function NotFound() {
  const ready = useRevealReady();

  return (
    <Frame>
      <motion.div
        className={styles.wrap}
        variants={revealContainer(0.08)}
        initial="hidden"
        animate={ready ? "show" : "hidden"}
      >
        <motion.div className={styles.code} variants={revealItem}>
          404
        </motion.div>
        <motion.h1 className={styles.title} variants={revealItem}>
          Page not found
        </motion.h1>
        <motion.p className={styles.text} variants={revealItem}>
          That tool doesn&apos;t exist - it may have been renamed or never
          existed. Head back and pick one from the shelf.
        </motion.p>
        <motion.div variants={revealItem}>
          <Link to="/" className={styles.button}>
            <ArrowLeft size={16} strokeWidth={1.9} />
            Back to all tools
          </Link>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default NotFound;
