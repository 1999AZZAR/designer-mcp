import * as https from "https";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawnSync } from "child_process";

export interface Palette {
  name: string;
  colors: string[];
  tags?: string[];
  likes?: number;
}

export interface PaletteData {
  palettes: Palette[];
}

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
const CACHE_TTL_MS = 3600_000;

function cacheDir(): string {
  const dir = path.join(os.homedir(), ".cache", "color-palette-hunter");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cachePath(key: string): string {
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return path.join(cacheDir(), `${hash}.json`);
}

function isCacheValid(p: string): boolean {
  try {
    const stat = fs.statSync(p);
    return Date.now() - stat.mtimeMs < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": USER_AGENT }, timeout: 15000 },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return fetchUrl(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

function normalizePalette(raw: any): Palette | null {
  if (raw && Array.isArray(raw.colors) && raw.colors.length >= 3) {
    return {
      colors: raw.colors.map((c: string) => (c.startsWith("#") ? c : `#${c}`)),
      name: raw.name ?? raw.title ?? "Untitled",
      tags: raw.tags,
      likes: raw.likes,
    };
  }
  if (raw && Array.isArray(raw) && raw.length >= 3) {
    return {
      colors: raw.map((c: string) => (c.startsWith("#") ? c : `#${c}`)),
      name: "Untitled",
    };
  }
  return null;
}

function parseHtmlPalettes(html: string, limit: number): Palette[] {
  const hexRe = /#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?/g;
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const m of html.match(hexRe) ?? []) {
    if (!seen.has(m)) {
      seen.add(m);
      unique.push(m);
    }
  }
  const palettes: Palette[] = [];
  for (let i = 0; i < unique.length; i += 4) {
    const colors = unique.slice(i, i + 4);
    if (colors.length >= 3) {
      palettes.push({ colors, name: `Palette ${palettes.length + 1}` });
      if (palettes.length >= limit) break;
    }
  }
  return palettes;
}

export async function fetchPalettes(
  mode: string,
  opts: { theme?: string; query?: string; limit?: number } = {},
): Promise<PaletteData> {
  const limit = opts.limit ?? 5;
  const baseUrl = "https://www.colorhunt.co/api/palettes";

  let url: string;
  let cacheKey: string;

  switch (mode) {
    case "trending":
      url = `${baseUrl}/trending?count=${limit}`;
      cacheKey = `trending:${limit}`;
      break;
    case "popular":
      url = `${baseUrl}/popular?count=${limit}`;
      cacheKey = `popular:${limit}`;
      break;
    case "random":
      url = `${baseUrl}/random?count=${limit}`;
      cacheKey = `random:${limit}`;
      break;
    case "theme": {
      const term = opts.theme ?? "";
      url = `${baseUrl}/search?q=${encodeURIComponent(term)}&count=${limit}`;
      cacheKey = `theme:${term}:${limit}`;
      break;
    }
    case "query": {
      const term = opts.query ?? "";
      url = `${baseUrl}/search?q=${encodeURIComponent(term)}&count=${limit}`;
      cacheKey = `query:${term}:${limit}`;
      break;
    }
    default: {
      const term = opts.query ?? opts.theme ?? "";
      url = `${baseUrl}/search?q=${encodeURIComponent(term)}&count=${limit}`;
      cacheKey = `search:${term}:${limit}`;
    }
  }

  const cp = cachePath(cacheKey);
  if (isCacheValid(cp)) {
    return JSON.parse(fs.readFileSync(cp, "utf8"));
  }

  let palettes: Palette[] = [];
  try {
    const raw = await fetchUrl(url);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      palettes = parsed.map(normalizePalette).filter(Boolean) as Palette[];
    } else if (parsed && Array.isArray(parsed.palettes)) {
      palettes = parsed.palettes
        .map(normalizePalette)
        .filter(Boolean) as Palette[];
    } else if (parsed && typeof parsed === "object") {
      const n = normalizePalette(parsed);
      if (n) palettes = [n];
    }
    palettes = palettes.slice(0, limit);
  } catch {
    // API failed, try HTML scraping fallback
    try {
      const fallbackUrl =
        mode === "trending"
          ? "https://www.colorhunt.co/palettes/trending"
          : mode === "popular"
            ? "https://www.colorhunt.co/palettes/popular"
            : `https://www.colorhunt.co/search?q=${encodeURIComponent(opts.query ?? opts.theme ?? "")}`;
      const html = await fetchUrl(fallbackUrl);
      palettes = parseHtmlPalettes(html, limit);
    } catch {
      // HTML scraping also failed, try skill shell script as last resort
      palettes = trySkillShellScript(mode, opts, limit);
    }
  }

  const data: PaletteData = {
    palettes: palettes.length ? palettes : fallbackPalettes(),
  };
  fs.writeFileSync(cp, JSON.stringify(data), "utf8");
  return data;
}

function fallbackPalettes(): Palette[] {
  return [
    {
      name: "Modern Minimalist",
      colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#F7DC6F"],
    },
    {
      name: "Pastel Dreams",
      colors: ["#FFB3BA", "#FFCCCB", "#FFFFBA", "#BAE1FF"],
    },
    {
      name: "Dark & Bold",
      colors: ["#2C3E50", "#E74C3C", "#ECF0F1", "#3498DB"],
    },
  ];
}

function trySkillShellScript(
  mode: string,
  opts: { theme?: string; query?: string; limit?: number },
  limit: number,
): Palette[] {
  const skillPath =
    process.env.COLOR_PALETTE_HUNTER_PATH ??
    path.join(__dirname, "..", "skills", "color-palette-hunter");
  const script = path.join(skillPath, "scripts", "fetch-palette.sh");

  if (!fs.existsSync(script)) return [];

  const args = ["--limit", String(limit), "--format", "json"];
  if (mode === "trending") args.push("--trending");
  else if (mode === "popular") args.push("--popular");
  else if (mode === "random") args.push("--random");
  else if (opts.theme) args.push("--theme", opts.theme);
  else if (opts.query) args.push("--query", opts.query);

  try {
    const result = spawnSync("bash", [script, ...args], {
      encoding: "utf8",
      timeout: 15000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    if (result.status === 0 && result.stdout) {
      const parsed = JSON.parse(result.stdout);
      if (Array.isArray(parsed.palettes)) {
        return parsed.palettes
          .map(normalizePalette)
          .filter(Boolean) as Palette[];
      }
    }
  } catch {
    // shell script fallback failed
  }
  return [];
}
