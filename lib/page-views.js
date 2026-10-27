import fs from "fs";
import path from "path";

const VIEWS_FILE_PATH = path.join(process.cwd(), "lib", "data", "page-views.json");

// Established baseline visitor counts for Heer Ranjha pages
const BASELINE_VIEWS = {
  "/": 3140,
  "/shop": 2280,
  "/about-us": 1420,
  "/stores": 980,
  "/cart": 760,
  "/checkout": 430,
  "/wishlist": 620,
  "/order-tracking": 490,
};

let inMemoryViews = null;
let saveTimeout = null;

function loadViewsFromDisk() {
  if (inMemoryViews !== null) return inMemoryViews;

  try {
    if (fs.existsSync(VIEWS_FILE_PATH)) {
      const content = fs.readFileSync(VIEWS_FILE_PATH, "utf8");
      inMemoryViews = JSON.parse(content);
      if (typeof inMemoryViews === "object" && inMemoryViews !== null) {
        return inMemoryViews;
      }
    }
  } catch (err) {
    console.error("Failed to read page-views.json:", err.message);
  }

  inMemoryViews = { ...BASELINE_VIEWS };
  return inMemoryViews;
}

function scheduleSaveToDisk() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      fs.mkdirSync(path.dirname(VIEWS_FILE_PATH), { recursive: true });
      fs.writeFileSync(VIEWS_FILE_PATH, JSON.stringify(inMemoryViews, null, 2), "utf8");
    } catch (err) {
      console.error("Failed to save page-views.json:", err.message);
    }
  }, 1000);
}

export function normalizePath(rawPath) {
  if (!rawPath || typeof rawPath !== "string") return "/";
  let clean = rawPath.split("?")[0].split("#")[0].trim().toLowerCase();
  if (!clean.startsWith("/")) clean = "/" + clean;
  if (clean.length > 1 && clean.endsWith("/")) clean = clean.slice(0, -1);
  return clean;
}

export function getPageViews(rawPath) {
  const views = loadViewsFromDisk();
  const pathKey = normalizePath(rawPath);

  if (typeof views[pathKey] === "number") {
    return views[pathKey];
  }

  // For individual product pages, create a realistic seeded baseline based on slug hash
  if (pathKey.startsWith("/product/")) {
    const hash = pathKey.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseline = 180 + (hash % 240);
    views[pathKey] = baseline;
    scheduleSaveToDisk();
    return baseline;
  }

  const baseline = BASELINE_VIEWS[pathKey] || 160;
  views[pathKey] = baseline;
  scheduleSaveToDisk();
  return baseline;
}

export function incrementPageViews(rawPath) {
  const views = loadViewsFromDisk();
  const pathKey = normalizePath(rawPath);

  const current = getPageViews(pathKey);
  const updated = current + 1;
  views[pathKey] = updated;

  scheduleSaveToDisk();
  return updated;
}

export function getAllPageViews() {
  const views = loadViewsFromDisk();
  let total = 0;
  for (const key of Object.keys(views)) {
    total += Number(views[key] || 0);
  }
  return {
    views,
    total,
  };
}
