import { normalizeConfig, normalizeServerMap } from "./normalize.js";
import { fromServerWire, fromWire, isWireConfig, toServerWire, toWire } from "./wire.js";

export const CONFIG_MAGIC = "PLY1:";
export const SERVER_MAGIC = "PLYSRV1:";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function cleanFences(value) {
  return String(value || "")
    .trim()
    .replace(/^```(?:txt|text|json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

async function gzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(
    new CompressionStream("gzip"),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(
    new DecompressionStream("gzip"),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toBase64Url(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = normalized + (padding ? "=".repeat(4 - padding) : "");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function parseJson(value, label) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Invalid ${label} JSON.`);
  }
}

export async function encodeConfig(config) {
  const wire = toWire(config);
  const bytes = encoder.encode(JSON.stringify(wire));
  const compressed = await gzip(bytes);
  return CONFIG_MAGIC + toBase64Url(compressed);
}

export async function decodeConfig(code) {
  const cleaned = cleanFences(code);
  if (!cleaned) throw new Error("The config is empty.");

  if (cleaned.startsWith(SERVER_MAGIC)) {
    throw new Error("That is a server export. Paste it into the server import field instead.");
  }

  if (cleaned.startsWith(CONFIG_MAGIC)) {
    const payload = cleaned.slice(CONFIG_MAGIC.length).replace(/\s+/g, "");
    if (payload.length > 200_000) throw new Error("The config is too large.");
    let json;
    try {
      json = decoder.decode(await gunzip(fromBase64Url(payload)));
    } catch {
      throw new Error("Could not unpack the config. Check that you copied all of it.");
    }
    const parsed = parseJson(json, "config");
    return normalizeConfig(isWireConfig(parsed) ? fromWire(parsed) : parsed);
  }

  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    throw new Error("Unknown config format. It should start with PLY1: or {.");
  }

  const parsed = parseJson(cleaned, "config");
  return normalizeConfig(isWireConfig(parsed) ? fromWire(parsed) : parsed);
}

export async function encodeServerMap(server) {
  const normalized = normalizeServerMap(server);
  const wire = toServerWire(normalized);
  const bytes = encoder.encode(JSON.stringify(wire));
  const compressed = await gzip(bytes);
  return SERVER_MAGIC + toBase64Url(compressed);
}

export async function decodeServerMap(code) {
  const cleaned = cleanFences(code);
  if (!cleaned) throw new Error("The server export is empty.");

  if (cleaned.startsWith(CONFIG_MAGIC)) {
    throw new Error("That is a bot config. Paste it into the config import field instead.");
  }

  if (cleaned.startsWith(SERVER_MAGIC)) {
    const payload = cleaned.slice(SERVER_MAGIC.length).replace(/\s+/g, "");
    if (payload.length > 200_000) throw new Error("The server export is too large.");
    let json;
    try {
      json = decoder.decode(await gunzip(fromBase64Url(payload)));
    } catch {
      throw new Error("Could not unpack the server export. Check that you copied all of it.");
    }
    return normalizeServerMap(fromServerWire(parseJson(json, "server")));
  }

  if (!cleaned.startsWith("{")) {
    throw new Error("Unknown server format. It should start with PLYSRV1: or {.");
  }

  const parsed = parseJson(cleaned, "server");
  if (parsed.channels || parsed.roles) return normalizeServerMap(parsed);
  return normalizeServerMap(fromServerWire(parsed));
}

export function configCodeSize(code) {
  return new TextEncoder().encode(String(code || "")).length;
}
