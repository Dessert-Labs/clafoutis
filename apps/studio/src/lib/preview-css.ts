import type { DTCGTokenFile } from "@clafoutis/studio-core";

const STYLE_ID = "studio-preview";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let generationStatus: "idle" | "generating" | "error" = "idle";
const statusListeners = new Set<(status: typeof generationStatus) => void>();

export function getGenerationStatus() {
  return generationStatus;
}

export function onGenerationStatusChange(
  listener: (status: typeof generationStatus) => void,
) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function setStatus(status: typeof generationStatus) {
  generationStatus = status;
  for (const listener of statusListeners) {
    listener(status);
  }
}

export function injectPreviewCSS(baseCSS: string, darkCSS?: string) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }

  const combined = darkCSS ? `${baseCSS}\n${darkCSS}` : baseCSS;
  el.textContent = combined;
}

export async function regeneratePreview(
  tokenFiles: Record<string, DTCGTokenFile>,
) {
  setStatus("generating");
  try {
    const response = await fetch("/__studio/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokenFiles),
    });

    const data = await response.json();

    if (data.success) {
      injectPreviewCSS(data.baseCSS, data.darkCSS);
      setStatus("idle");
    } else {
      if (data.baseCSS) {
        injectPreviewCSS(data.baseCSS, data.darkCSS);
      }
      setStatus("error");
      console.warn("Generation failed:", data.error?.message);
    }
  } catch (err) {
    setStatus("error");
    console.error("Failed to regenerate preview:", err);
  }
}

export function debouncedRegenerate(
  tokenFiles: Record<string, DTCGTokenFile>,
  delay = 300,
) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    regeneratePreview(tokenFiles);
  }, delay);
}
