import { useEffect } from "react";

/**
 * Listens for a paste event on the window and, if the clipboard contains an
 * image, extracts it as a File and passes it to `onImage`.
 */
export function usePasteImage(
  onImage: (file: File) => void,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            onImage(file);
          }
          break;
        }
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onImage, enabled]);
}
