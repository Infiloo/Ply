import { appConfig } from "../config.js";

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = levels[appConfig.logLevel] ?? levels.info;

function write(level, scope, message, error) {
  if ((levels[level] ?? levels.info) > threshold) return;
  const time = new Date().toISOString().slice(11, 19);
  const prefix = `[${time}] ${level.toUpperCase()} ${scope ? `(${scope}) ` : ""}`;
  if (error) {
    console[level === "debug" ? "log" : level](`${prefix}${message}`, error);
  } else {
    console[level === "debug" ? "log" : level](`${prefix}${message}`);
  }
}

export function logger(scope) {
  return {
    error: (message, error) => write("error", scope, message, error),
    warn: (message, error) => write("warn", scope, message, error),
    info: (message) => write("info", scope, message),
    debug: (message) => write("debug", scope, message),
  };
}
