import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import { revealBlock } from "../../lib/reveal";
import type { Tool } from "../../data/tools";
import styles from "./ToolCard.module.css";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon;

  const content = (
    <>
      <div className={styles.iconBox}>
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div className={styles.name}>{tool.name}</div>
      <div className={styles.description}>{tool.description}</div>
      <span
        className={clsx(
          styles.pill,
          tool.status === "ready" ? styles.pillReady : styles.pillSoon
        )}
      >
        {tool.status === "ready" ? "ready" : "soon"}
      </span>
    </>
  );

  if (tool.status === "ready") {
    return (
      <motion.div variants={revealBlock}>
        <Link to={tool.path} className={styles.card}>
          <span className={styles.cornerArrow}>
            <ArrowUpRight size={16} strokeWidth={1.75} />
          </span>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={revealBlock}>
      <div className={clsx(styles.card, styles.soon)}>{content}</div>
    </motion.div>
  );
}
