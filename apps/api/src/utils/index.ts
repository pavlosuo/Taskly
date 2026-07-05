import fs from "fs";
import path from "path";

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace("T", " ").substring(0, 19);
}

function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function formatArgs(args: unknown[]) {
  return args
    .map((arg) => {
      if (typeof arg === "object" && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(" ");
}

export function log(...args: unknown[]) {
  const logDir = "./logs";
  const logPath = path.join(logDir, "log.txt");
  ensureDirectoryExists(logDir);
  const timestamp = getTimestamp();
  const message = formatArgs(args);
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFile(logPath, logEntry, "utf8", (err) => {
    if (err) {
      console.error("❌ Error writing to log file:", err);
    }
  });
}
