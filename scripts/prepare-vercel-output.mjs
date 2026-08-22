import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const vercelOutputDir = path.join(rootDir, ".vercel", "output");
const vercelStaticDir = path.join(vercelOutputDir, "static");
const vercelFunctionsDir = path.join(vercelOutputDir, "functions");
const outputPublicDir = path.join(rootDir, ".output", "public");

try {
  // Ensure .vercel/output structure
  if (fs.existsSync(vercelOutputDir)) {
    // 1. Ensure config.json for Vercel Build Output API v3
    const configPath = path.join(vercelOutputDir, "config.json");
    const vercelConfig = {
      version: 3,
      routes: [
        {
          src: "^/assets/(.*)$",
          headers: { "cache-control": "public, max-age=31536000, immutable" },
          continue: true,
        },
        {
          handle: "filesystem",
        },
        {
          src: "^/(.*)$",
          dest: "/__server",
        },
      ],
    };
    fs.writeFileSync(configPath, JSON.stringify(vercelConfig, null, 2), "utf8");
    console.log("[AutoConnect Build] Generated .vercel/output/config.json (Vercel Build Output API v3)");

    // 2. Ensure static assets are linked or copied
    if (!fs.existsSync(vercelStaticDir)) {
      fs.mkdirSync(vercelStaticDir, { recursive: true });
    }

    if (fs.existsSync(outputPublicDir)) {
      copyRecursiveSync(outputPublicDir, vercelStaticDir);
      console.log("[AutoConnect Build] Synced static assets from .output/public to .vercel/output/static");
    }
  }
} catch (err) {
  console.warn("[AutoConnect Build] Warning during Vercel output preparation:", err);
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  }
}
