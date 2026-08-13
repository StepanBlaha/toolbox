import { useRef, useState, type ReactNode, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import styles from "./HoverPreview.module.css";

const OFFSET_Y = 28;

type Props = {
  children: ReactNode;
  image: string;
  alt?: string;
  href?: string;
  hoverColor?: string;
  className?: string;
  /** "cursor" follows the pointer (default). "corner" pins above the text's
   *  top-right corner with a static tilt and only subtle drift. */
  mode?: "cursor" | "corner";
  /** static tilt in degrees (corner mode). */
  tilt?: number;
  previewWidth?: number;
  previewHeight?: number;
};

export default function HoverPreview({
  children,
  image,
  alt = "",
  href,
  hoverColor,
  className,
  mode = "cursor",
  tilt = 0,
  previewWidth,
  previewHeight,
}: Props) {
  const [show, setShow] = useState(false);
  const prevX = useRef<number | null>(null);

  const corner = mode === "corner";
  const W = previewWidth ?? (corner ? 112 : 220);
  const H = previewHeight ?? (corner ? 138 : 132);

  const top = useMotionValue(0);
  const left = useMotionValue(0);
  const rotate = useMotionValue(corner ? tilt : 0);

  // Calmer spring for the corner variant so it barely drifts.
  const springCfg = corner
    ? { stiffness: 180, damping: 26 }
    : { stiffness: 300, damping: 30 };
  const springTop = useSpring(top, springCfg);
  const springLeft = useSpring(left, springCfg);
  const springRotate = useSpring(rotate, { stiffness: 300, damping: 20 });

  // Anchor above the top-right corner of the trigger, with a small parallax.
  const cornerBase = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return {
      left: r.right - W * 0.28,
      top: r.top - H - 4,
      cx: r.left + r.width / 2,
      cy: r.top,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (corner) {
      const base = cornerBase(e.currentTarget as HTMLElement);
      // subtle drift toward the cursor (small factors = "won't move much")
      const dx = (e.clientX - base.cx) * 0.14;
      const dy = (e.clientY - base.cy) * 0.1;
      const nextLeft = base.left + dx;
      const nextTop = base.top + dy;
      if (prevX.current === null) {
        springLeft.jump(nextLeft);
        springTop.jump(nextTop);
      }
      left.set(nextLeft);
      top.set(nextTop);
      prevX.current = e.clientX;
      return;
    }

    const nextTop = e.clientY - H - OFFSET_Y;
    const nextLeft = e.clientX - W / 2;
    if (prevX.current === null) {
      springTop.jump(nextTop);
      springLeft.jump(nextLeft);
    } else {
      const deltaX = e.clientX - prevX.current;
      rotate.set(Math.max(-15, Math.min(15, deltaX * 1.2)));
    }
    top.set(nextTop);
    left.set(nextLeft);
    prevX.current = e.clientX;
  };

  const handlers = {
    onMouseEnter: () => {
      setShow(true);
      prevX.current = null;
    },
    onMouseLeave: () => {
      setShow(false);
      prevX.current = null;
      if (!corner) rotate.set(0);
    },
    onMouseMove: handleMouseMove,
  };

  const style = hoverColor
    ? ({ "--link-hover": hoverColor } as CSSProperties)
    : undefined;
  const cls = className ? `${styles.link} ${className}` : styles.link;

  const trigger = href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cls}
      style={style}
      {...handlers}
    >
      {children}
    </a>
  ) : (
    <span className={cls} style={style} {...handlers}>
      {children}
    </span>
  );

  return (
    <>
      {trigger}

      {createPortal(
        <AnimatePresence>
          {show && (
            <motion.div
              className={styles.preview}
              initial={{ opacity: 0, scale: 0.85, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -8 }}
              style={{
                top: springTop,
                left: springLeft,
                rotate: springRotate,
                minWidth: corner ? 0 : undefined,
              }}
            >
              <img
                src={image}
                alt={alt}
                draggable={false}
                className={styles.previewImg}
                style={{ width: W, height: H }}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
