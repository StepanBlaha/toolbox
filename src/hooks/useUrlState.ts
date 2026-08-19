import { useCallback, useRef, useState } from "react";

const URL_PARAM = "s";

function readStateFromUrl<T>(defaults: T): T {
  if (typeof window === "undefined") return defaults;

  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(URL_PARAM);
    if (!raw) return defaults;

    const decoded = JSON.parse(decodeURIComponent(raw));
    if (typeof decoded !== "object" || decoded === null || Array.isArray(decoded)) {
      return defaults;
    }

    return { ...defaults, ...decoded };
  } catch {
    return defaults;
  }
}

function writeStateToUrl<T>(state: T): void {
  if (typeof window === "undefined") return;

  try {
    const encoded = encodeURIComponent(JSON.stringify(state));
    const url = new URL(window.location.href);
    url.search = `${URL_PARAM}=${encoded}`;
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  } catch {
    // Ignore serialization failures; URL just won't be updated.
  }
}

export function useUrlState<T>(
  defaults: T
): [T, (next: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => readStateFromUrl(defaults));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setUrlState = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => {
      const value = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        writeStateToUrl(value);
        timeoutRef.current = null;
      }, 50);

      return value;
    });
  }, []);

  return [state, setUrlState];
}
