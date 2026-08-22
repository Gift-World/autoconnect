import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const vercelOutputDir = path.join(rootDir, ".vercel", "output");
const vercelStaticDir = path.join(vercelOutputDir, "static");
const vercelStaticAssetsDir = path.join(vercelStaticDir, "assets");
const vercelFunctionsDir = path.join(vercelOutputDir, "functions");
const distDir = path.join(rootDir, "dist");
const outputPublicDir = path.join(rootDir, ".output", "public");

try {
  // 1. Ensure static assets are synced if .output/public exists
  if (fs.existsSync(outputPublicDir)) {
    if (!fs.existsSync(vercelStaticDir)) {
      fs.mkdirSync(vercelStaticDir, { recursive: true });
    }
    copyRecursiveSync(outputPublicDir, vercelStaticDir);
    console.log("[AutoConnect Build] Synced static assets from .output/public to .vercel/output/static");
  }

  // 2. Find the compiled CSS and JS bundle filenames
  let jsEntry = "";
  let cssEntry = "";

  if (fs.existsSync(vercelStaticAssetsDir)) {
    const assetFiles = fs.readdirSync(vercelStaticAssetsDir);
    // Find main JS entry (index-*.js or main-*.js or the largest JS bundle)
    const indexJs = assetFiles.find((f) => f.startsWith("index-") && f.endsWith(".js"));
    const mainJs = assetFiles.find((f) => f.startsWith("main-") && f.endsWith(".js"));
    jsEntry = indexJs || mainJs || assetFiles.find((f) => f.endsWith(".js")) || "";

    // Find main CSS entry (styles-*.css or index-*.css or *.css)
    const stylesCss = assetFiles.find((f) => f.startsWith("styles-") && f.endsWith(".css"));
    const indexCss = assetFiles.find((f) => f.startsWith("index-") && f.endsWith(".css"));
    cssEntry = stylesCss || indexCss || assetFiles.find((f) => f.endsWith(".css")) || "";
  }

  console.log(`[AutoConnect Build] Detected client entries -> JS: "${jsEntry}", CSS: "${cssEntry}"`);

  // 3. Create production index.html with resolved bundle paths
  const productionHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AutoConnect — Buy & Import Cars Worldwide</title>
    <meta name="description" content="Browse verified car listings from sellers across the globe. Buy locally or import directly." />
    <meta property="og:title" content="AutoConnect — Buy & Import Cars Worldwide" />
    <meta property="og:description" content="Browse verified car listings from sellers across the globe. Buy locally or import directly." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" />
    ${cssEntry ? `<link rel="stylesheet" href="/assets/${cssEntry}" />` : ""}
  </head>
  <body>
    <div id="root"></div>
    ${jsEntry ? `<script type="module" src="/assets/${jsEntry}"></script>` : `<script type="module" src="/src/main.tsx"></script>`}
  </body>
</html>
`;

  // Write to .vercel/output/static/index.html
  if (!fs.existsSync(vercelStaticDir)) {
    fs.mkdirSync(vercelStaticDir, { recursive: true });
  }
  const staticIndexHtmlPath = path.join(vercelStaticDir, "index.html");
  fs.writeFileSync(staticIndexHtmlPath, productionHtml, "utf8");
  console.log("[AutoConnect Build] Generated .vercel/output/static/index.html");

  // Write to dist/index.html and copy static assets to dist/
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  fs.writeFileSync(path.join(distDir, "index.html"), productionHtml, "utf8");
  copyRecursiveSync(vercelStaticDir, distDir);
  console.log("[AutoConnect Build] Synced complete static app bundle to dist/");

  // 4. Generate .vercel/output/config.json with comprehensive SPA + Server Routing
  if (fs.existsSync(vercelOutputDir)) {
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
          src: "^/_server(.*)$",
          dest: "/__server",
        },
        {
          src: "^/_serverFn(.*)$",
          dest: "/__server",
        },
        {
          src: "^/api/(.*)$",
          dest: "/__server",
        },
        {
          src: "^/(.*)$",
          dest: "/index.html",
        },
      ],
    };
    fs.writeFileSync(configPath, JSON.stringify(vercelConfig, null, 2), "utf8");
    console.log("[AutoConnect Build] Generated .vercel/output/config.json (SPA fallback + Vercel v3 routing)");
  }

  // 5. If renderer-template.mjs exists in SSR functions, patch it to point to real compiled assets
  if (fs.existsSync(vercelFunctionsDir) && jsEntry) {
    const findAndPatchRenderer = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findAndPatchRenderer(fullPath);
        } else if (entry.name === "renderer-template.mjs") {
          let content = fs.readFileSync(fullPath, "utf8");
          if (content.includes("/src/main.tsx")) {
            content = content.replace(
              "/src/main.tsx",
              `/assets/${jsEntry}`,
            );
            if (cssEntry && !content.includes(cssEntry)) {
              content = content.replace(
                "</head>",
                `<link rel=\\"stylesheet\\" href=\\"/assets/${cssEntry}\\" /></head>`,
              );
            }
            fs.writeFileSync(fullPath, content, "utf8");
            console.log(`[AutoConnect Build] Patched SSR renderer template at ${fullPath}`);
          }
        }
      }
    };
    findAndPatchRenderer(vercelFunctionsDir);
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
