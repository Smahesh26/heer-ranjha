import { prisma } from "@/lib/prisma";
import { json, badRequest } from "@/lib/http";
import { productSchema } from "@/lib/validators";
import { cookies } from "next/headers";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function parseProduct(product) {
  return {
    ...product,
    images: safeJsonParse(product.images, []),
    sizes: safeJsonParse(product.sizeOptions, []),
    sizeCharges: safeJsonParse(product.sizeCharges, {}),
    isLowStock: Number(product.stock || 0) <= Number(product.lowStockThreshold || 0),
  };
}

function getExtension(fileName) {
  const ext = path.extname(fileName || "").toLowerCase();
  return ext || ".bin";
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

async function saveUpload(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(uploadDir, { recursive: true });
  const fileName = `${Date.now()}-${crypto.randomUUID()}${getExtension(file.name)}`;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);
  return `/uploads/products/${fileName}`;
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

  const products = await prisma.product.findMany({
    where: {
      ...(active === "true" ? { active: true } : {}),
      ...(featured === "true" ? { featured: true } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const mappedProducts = products.map(parseProduct);
  const filteredProducts =
    lowStock === "true"
      ? mappedProducts.filter((product) => product.isLowStock)
      : mappedProducts;

  return json({ products: filteredProducts });
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return json({ error: "Admin access required" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  let payload = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const files = formData
      .getAll("images")
      .filter((file) => file instanceof File)
      .slice(0, 5);
    const uploadedImages = [];

    for (const file of files) {
      uploadedImages.push(await saveUpload(file));
    }

    payload = {
      slug: normalizeSlug(formData.get("slug")?.toString(), formData.get("name")?.toString() || ""),
      name: formData.get("name")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      category: formData.get("category")?.toString() || "",
      subCategory: formData.get("subCategory")?.toString() || "",
      collection: formData.get("collection")?.toString() || "",
      fabric: formData.get("fabric")?.toString() || "",
      price: toNumber(formData.get("price"), 0),
      mrp: formData.get("mrp") ? toNumber(formData.get("mrp"), 0) : undefined,
      stock: toNumber(formData.get("stock"), 0),
      images: uploadedImages,
      sizes: parseSizes(formData.get("sizes")),
      sizeCharges: parseSizeCharges(formData.get("sizeCharges")),
      clothCare: formData.get("clothCare")?.toString() || undefined,
      termsAndConditions: formData.get("termsAndConditions")?.toString() || undefined,
      featured: toBool(formData.get("featured"), false),
      active: toBool(formData.get("active"), true),
    };
  } else {
    payload = await request.json().catch(() => null);
  }

  const parsed = productSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid product data", parsed.error.flatten());
  }

  const {
    images,
    sizes,
    sizeCharges,
    ...restData
  } = parsed.data;

  const created = await prisma.product.create({
    data: {
      ...restData,
      images: JSON.stringify(images),
      sizeOptions: JSON.stringify(sizes || []),
      sizeCharges: JSON.stringify(sizeCharges || {}),
    },
  });
  return json({ product: parseProduct(created) }, { status: 201 });
}
