import { prisma } from "@/lib/prisma";
import { json, notFound, badRequest } from "@/lib/http";
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

function getExtension(fileName) {
  const ext = path.extname(fileName || "").toLowerCase();
  return ext || ".bin";
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
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return notFound("Product not found");
  return json({ product: parseProduct(product) });
}

export async function PATCH(request, { params }) {
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
      slug: normalizeSlug(formData.get("slug")?.toString()),
      name: formData.get("name")?.toString() || undefined,
      description: formData.get("description")?.toString() || undefined,
      category: formData.get("category")?.toString() || undefined,
      subCategory: formData.get("subCategory")?.toString() || undefined,
      collection: formData.get("collection")?.toString() || undefined,
      fabric: formData.get("fabric")?.toString() || undefined,
      price: toNumber(formData.get("price")),
      mrp: toNumber(formData.get("mrp")),
      stock: toNumber(formData.get("stock")),
      images: uploadedImages.length ? uploadedImages : undefined,
      sizes: parseSizes(formData.get("sizes")),
      sizeCharges: parseSizeCharges(formData.get("sizeCharges")),
      clothCare: formData.get("clothCare")?.toString() || undefined,
      termsAndConditions: formData.get("termsAndConditions")?.toString() || undefined,
      featured: toBool(formData.get("featured")),
      active: toBool(formData.get("active")),
    };
  } else {
    payload = await request.json().catch(() => null);
  }

  const parsed = productSchema.partial().safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid product data", parsed.error.flatten());
  }

  const {
    images,
    sizes,
    sizeCharges,
    ...restData
  } = parsed.data;

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...restData,
      ...(Object.prototype.hasOwnProperty.call(parsed.data, "images")
        ? { images: JSON.stringify(images || []) }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(parsed.data, "sizes")
        ? { sizeOptions: JSON.stringify(sizes || []) }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(parsed.data, "sizeCharges")
        ? { sizeCharges: JSON.stringify(sizeCharges || {}) }
        : {}),
    },
  });
  return json({ product: parseProduct(updated) });
}

export async function DELETE(_, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return json({ error: "Admin access required" }, { status: 401 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { productId: params.id } });
      await tx.wishlistItem.deleteMany({ where: { productId: params.id } });
      await tx.product.delete({ where: { id: params.id } });
    });

    return json({ ok: true, deleted: true, archived: false });
  } catch (error) {
    const code = error?.code || "";

    if (code === "P2003") {
      await prisma.product.update({
        where: { id: params.id },
        data: { active: false, featured: false },
      });

      return json({
        ok: true,
        deleted: false,
        archived: true,
        message: "Product has order history, so it was archived instead of being deleted.",
      });
    }

    throw error;
  }
}
