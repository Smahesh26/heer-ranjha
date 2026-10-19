import { getProductById } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { json, notFound, badRequest } from "@/lib/http";
import { productSchema } from "@/lib/validators";
import { cookies } from "next/headers";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";
import { uploadProductMedia, deleteProductMedia, sanitizeProductImageUrls } from "@/lib/product-media";

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
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSlug(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const cleaned = String(value)
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  return slugify(cleaned);
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

function toBool(value) {
  if (value === null || value === undefined || value === "") return undefined;
  return value === true || value === "true";
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSizes(value) {
  if (value === null || value === undefined) return undefined;
  return String(value)
    .split(",")
    .map((size) => size.trim().toUpperCase())
    .filter(Boolean);
}

function parseSizeCharges(value) {
  if (value === null || value === undefined || value === "") return undefined;
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

export async function GET(_, { params }) {
  const product = await getProductById(params.id);
  if (!product) return notFound("Product not found");
  return json({ product: parseProduct(product) });
}

export async function PATCH(request, { params }) {
  return badRequest("Product modification is disabled in static mode.");
}

export async function DELETE(_, { params }) {
  return badRequest("Product deletion is disabled in static mode.");
}
