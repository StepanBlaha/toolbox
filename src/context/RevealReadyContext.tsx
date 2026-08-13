import { createContext, useContext, type ReactNode } from "react";

/**
 * Tracks whether the page is "ready" for scroll-reveal animations — i.e. the
 * preloader has finished. Until then, reveal sections stay hidden so they don't
 * silently animate behind the preloader overlay.
 */
const RevealReadyContext = createContext(false);

export function useRevealReady() {
  return useContext(RevealReadyContext);
}

export function RevealReadyProvider({
  ready,
  children,
}: {
  ready: boolean;
  children: ReactNode;
}) {
  return (
    <RevealReadyContext.Provider value={ready}>
      {children}
    </RevealReadyContext.Provider>
  );
}
