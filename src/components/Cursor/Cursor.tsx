import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import styles from "./Cursor.module.css";

export default function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { damping: 28, stiffness: 400, mass: 0.4 });
  const sy = useSpring(y, { damping: 28, stiffness: 400, mass: 0.4 });

  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const el = e.target as HTMLElement;
      setHovering(!!el.closest("a, button, [data-cursor='hover']"));
    };
    const leave = () => setVisible(false);

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, [x, y]);

  return (
    <motion.div
      className={styles.cursor}
      style={{ x: sx, y: sy, opacity: visible ? 1 : 0 }}
      aria-hidden
    >
      <motion.svg
        viewBox="0 0 24 24"
        className={styles.icon}
        animate={{ scale: hovering ? 1.6 : 1, rotate: hovering ? -12 : 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <path
          d="M4 3 L20 10 L12.5 12.5 L10 20 Z"
          fill="var(--accent)"
          stroke="var(--fg)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.div>
  );
}
