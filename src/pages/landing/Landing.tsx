import { motion } from "framer-motion";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { ToolCard } from "../../components/ToolCard/ToolCard";
import { tools } from "../../data/tools";
import { revealContainer } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Landing.module.css";

export function Landing() {
  const ready = useRevealReady();

  return (
    <Frame>
      <div className={styles.intro}>
        <h1 className={styles.title}>toolbox</h1>
        <p className={styles.subtitle}>
          A small collection of design &amp; dev utilities.
        </p>
      </div>

      <SectionHeading title="Tools" count={tools.length} level="h2" />

      <motion.div
        className={styles.grid}
        variants={revealContainer(0.03)}
        initial="hidden"
        animate={ready ? "show" : "hidden"}
      >
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </motion.div>
    </Frame>
  );
}
