import type { ReactNode } from "react";
import clsx from "clsx";
import SiteFooter from "../SiteFooter/SiteFooter";
import styles from "./Frame.module.css";

interface FrameProps {
  children: ReactNode;
  wide?: boolean;
}

export function Frame({ children, wide }: FrameProps) {
  return (
    <div className={styles.page}>
      <div className={clsx(styles.container, wide && styles.wide)}>
        <div className={styles.inner}>{children}</div>
        <SiteFooter />
      </div>
    </div>
  );
}
