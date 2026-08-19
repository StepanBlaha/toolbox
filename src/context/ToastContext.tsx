import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { prefersReducedMotion } from "../lib/motionPref";

interface ToastItem {
  id: number;
  message: string;
}

type ToastFn = (message: string) => void;

const ToastContext = createContext<ToastFn | null>(null);

const DISMISS_MS = 2200;

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const reduced = prefersReducedMotion();

  const toast = useCallback<ToastFn>((message: string) => {
    const id = idRef.current++;
    setToasts((prev) => [...prev, { id, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DISMISS_MS);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: "fixed",
          left: "50%",
          bottom: "28px",
          transform: "translateX(-50%)",
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: reduced ? 0 : 12, scale: reduced ? 1 : 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduced ? 0 : 8, scale: reduced ? 1 : 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: "var(--fg)",
                color: "var(--bg)",
                fontFamily: "var(--sans)",
                fontSize: "13px",
                fontWeight: 500,
                padding: "10px 16px",
                borderRadius: "10px",
                boxShadow:
                  "0 12px 28px -14px color-mix(in oklab, var(--fg) 40%, transparent)",
                whiteSpace: "nowrap",
              }}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
