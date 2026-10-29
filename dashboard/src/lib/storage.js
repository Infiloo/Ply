import {
  createDefaultConfig,
  normalizeConfig,
  normalizeServerMap,
} from "@ply/shared";

const CONFIG_KEY = "ply.config.v1";
const SERVER_KEY = "ply.server.v1";

export function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return createDefaultConfig();
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return createDefaultConfig();
  }
}

export function saveConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Private browsing or a full storage quota; the app still works in memory.
  }
}

export function loadServer() {
  try {
    const raw = localStorage.getItem(SERVER_KEY);
    if (!raw) return null;
    return normalizeServerMap(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveServer(server) {
  try {
    if (server) localStorage.setItem(SERVER_KEY, JSON.stringify(server));
    else localStorage.removeItem(SERVER_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function clearLocalState() {
  try {
    localStorage.removeItem(CONFIG_KEY);
    localStorage.removeItem(SERVER_KEY);
  } catch {
    // Ignore.
  }
}

export function downloadText(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
