import fs from "node:fs";
import path from "node:path";
import { ZipArchive } from "archiver";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SOURCE_DIR = path.resolve(__dirname, ".");
const OUTPUT_ZIP = path.resolve(__dirname, "archive.zip");

const BLACKLIST = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".env",
  "archive.zip",
  "uploads",
  ".vscode",
  "zip-project.js",
]);

async function createZip() {
  const output = fs.createWriteStream(OUTPUT_ZIP);
  const archive = new ZipArchive();
  const isExcluded = (name) => BLACKLIST.has(name);
  archive.on("warning", (err) => {
    if (err.code === "ENOENT") {
      console.warn(err.message);
    } else {
      archive.abort();
      throw err;
    }
  });
  archive.on("error", (err) => {
    throw err;
  });
  const closePromise = new Promise((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);
  });
  archive.pipe(output);

  async function addDirectory(directory, archivePath = "") {
    const entries = await fs.promises.readdir(directory, {
      withFileTypes: true,
    });
    for (const entry of entries) {
      if (isExcluded(entry.name)) continue;
      const fullPath = path.join(directory, entry.name);
      const relativePath = path.posix.join(archivePath, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        archive.append("", {
          name: `${relativePath}/`,
        });
        await addDirectory(fullPath, relativePath);
      } else if (entry.isFile()) {
        archive.file(fullPath, {
          name: relativePath,
        });
      }
    }
  }
  try {
    await addDirectory(SOURCE_DIR);
    await archive.finalize();
    await closePromise;
  } catch (e) {
    archive.abort();
    output.destroy();
    throw e;
  }
}

createZip().catch();
