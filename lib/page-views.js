import fs from "fs";
import path from "path";
import { prisma } from "./prisma";

const VIEWS_FILE_PATH = path.join(process.cwd(), "lib", "data", "page-views.json");

let inMemoryViews = null;
let saveTimeout = null;

function loadFallbackViewsFromDisk() {
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

  inMemoryViews = {};
  return inMemoryViews;
}

function scheduleSaveToDisk() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      fs.mkdirSync(path.dirname(VIEWS_FILE_PATH), { recursive: true });
      fs.writeFileSync(VIEWS_FILE_PATH, JSON.stringify(inMemoryViews || {}, null, 2), "utf8");
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

export async function getPageViews(rawPath) {
  const pathKey = normalizePath(rawPath);

  try {
    const record = await prisma.pageView.findUnique({
      where: { path: pathKey },
    });
    const views = record ? record.views : 0;
    
    const diskViews = loadFallbackViewsFromDisk();
    diskViews[pathKey] = views;
    return views;
  } catch (err) {
    const views = loadFallbackViewsFromDisk();
    return typeof views[pathKey] === "number" ? views[pathKey] : 0;
  }
}

export async function incrementPageViews(rawPath) {
  const pathKey = normalizePath(rawPath);

  try {
    const record = await prisma.pageView.upsert({
      where: { path: pathKey },
      create: { path: pathKey, views: 1 },
      update: { views: { increment: 1 } },
    });

    const views = loadFallbackViewsFromDisk();
    views[pathKey] = record.views;
    scheduleSaveToDisk();

    return record.views;
  } catch (err) {
    const views = loadFallbackViewsFromDisk();
    const current = typeof views[pathKey] === "number" ? views[pathKey] : 0;
    const updated = current + 1;
    views[pathKey] = updated;
    scheduleSaveToDisk();
    return updated;
  }
}

export async function getAllPageViews() {
  try {
    const records = await prisma.pageView.findMany({
      orderBy: { views: "desc" },
    });

    const views = {};
    let total = 0;
    for (const r of records) {
      views[r.path] = r.views;
      total += r.views;
    }

    inMemoryViews = { ...views };
    scheduleSaveToDisk();

    return { views, total };
  } catch (err) {
    const views = loadFallbackViewsFromDisk();
    let total = 0;
    for (const key of Object.keys(views)) {
      total += Number(views[key] || 0);
    }
    return { views, total };
  }
}
