import { useEffect, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import styles from "./Preloader.module.css";

const GREETINGS = ["Design.", "Tweak.", "Copy.", "Ship."];
const HOLD = 440;
const REVEAL_MS = 1200;

type Phase = "intro" | "reveal" | "done";

export default function Preloader({ onDone }: { onDone?: () => void }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);

  // Arc curtain driven by a single 0→1 progress. Quadratic bezier chord
  // rises from below the viewport (110) to above it (-30), control point
  // sits 25 units below the chord for a fixed concavity.
  const progress = useMotionValue(0);
  const arcPath = useTransform(progress, (p: number) => {
    const edge = 110 - p * 140;
    const control = edge + 25;
    return `M 0 ${edge} Q 50 ${control} 100 ${edge} L 100 110 L 0 110 Z`;
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
  }, []);

  useEffect(() => {
    if (reduce) setPhase("done");
  }, [reduce]);

  // Cycle greetings, then move into the reveal.
  useEffect(() => {
    if (phase !== "intro") return;
    const isLast = index >= GREETINGS.length - 1;
    const delay = isLast ? HOLD + 200 : HOLD;
    const t = window.setTimeout(() => {
      if (isLast) setPhase("reveal");
      else setIndex((i) => i + 1);
    }, delay);
    return () => window.clearTimeout(t);
  }, [phase, index]);

  // Drive the curved curtain.
  useEffect(() => {
    if (phase !== "reveal") return;
    const controls = animate(progress, 1, {
      duration: REVEAL_MS / 1000,
      ease: [0.85, 0, 0.15, 1],
      onComplete: () => setPhase("done"),
    });
    return () => controls.stop();
  }, [phase, progress]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        document.body.style.overflow = "";
        onDone?.();
      }}
    >
      {phase !== "done" && (
        <motion.div
          className={styles.wrap}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className={styles.center}>
            <AnimatePresence>
              {phase === "intro" && (
                <motion.span
                  key={index}
                  className={styles.greeting}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {GREETINGS[index]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <svg
            className={styles.arc}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <motion.path d={arcPath} style={{ fill: "var(--bg)" }} />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
