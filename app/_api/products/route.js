import { getProducts } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { json, badRequest } from "@/lib/http";
import { productSchema } from "@/lib/validators";
import { cookies } from "next/headers";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";
import { uploadProductMedia, sanitizeProductImageUrls } from "@/lib/product-media";

export const dynamic = "force-dynamic";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function parseProduct(product) {
  const parsedImages = safeJsonParse(product.images, []);
  return {
    ...product,
    images: sanitizeProductImageUrls(parsedImages),
    sizes: safeJsonParse(product.sizeOptions, []),
    sizeCharges: safeJsonParse(product.sizeCharges, {}),
    isLowStock: Number(product.stock || 0) <= Number(product.lowStockThreshold || 0),
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSlug(value, fallback = "") {
  const cleaned = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  return slugify(cleaned || fallback);
}

async function requireAdmin() {
  const token = cookies().get(getAuthCookieName())?.value;
  if (!token) return null;

  try {
    const decoded = verifyAuthToken(token);
    return decoded.role === "ADMIN" ? decoded : null;
  } catch {
    return null;
  }
}

function toBool(value, defaultValue = false) {
  if (value === null || value === undefined || value === "") return defaultValue;
  return value === true || value === "true";
}

function toNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === "") return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function parseSizes(value) {
  return String(value || "")
    .split(",")
    .map((size) => size.trim().toUpperCase())
    .filter(Boolean);
}

function parseSizeCharges(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(String(value));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([size, charge]) => [String(size).trim().toUpperCase(), Number(charge)])
        .filter(([size, charge]) => size && Number.isFinite(charge) && charge >= 0)
        .map(([size, charge]) => [size, Math.trunc(charge)])
    );
  } catch {
    return {};
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const active = url.searchParams.get("active");
  const featured = url.searchParams.get("featured");
  const lowStock = url.searchParams.get("lowStock");

  const params = {};
  if (active === "true") params.active = true;
  if (featured === "true") params.featured = true;

  const result = await getProducts(params);
  const products = result.products;

  const mappedProducts = products.map(parseProduct);
  const filteredProducts =
    lowStock === "true"
      ? mappedProducts.filter((product) => product.isLowStock)
      : mappedProducts;

  return json({ products: filteredProducts });
}

export async function POST(request) {
  return badRequest("Product creation is disabled in static mode.");
}
