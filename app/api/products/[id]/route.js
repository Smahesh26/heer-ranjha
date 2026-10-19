import { getProductById, updateProduct, deleteProduct } from "@/lib/products";
import { json, notFound, badRequest, unauthorized } from "@/lib/http";
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
  let images = [];
  if (Array.isArray(product.images)) {
    images = product.images;
  } else if (typeof product.images === "string") {
    images = safeJsonParse(product.images, []);
  }

  let sizes = [];
  if (Array.isArray(product.sizes)) {
    sizes = product.sizes;
  } else if (product.sizeOptions) {
    sizes = safeJsonParse(product.sizeOptions, []);
  } else if (typeof product.sizes === "string") {
    sizes = product.sizes.split(",").map((s) => s.trim()).filter(Boolean);
  }

  return {
    ...product,
    images: sanitizeProductImageUrls(images),
    sizes,
    sizeCharges: typeof product.sizeCharges === "object" ? product.sizeCharges : safeJsonParse(product.sizeCharges, {}),
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
  return value === true || value === "true" || value === "yes" || value === "1";
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSizes(value) {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((size) => size.trim().toUpperCase())
    .filter(Boolean);
}

export async function GET(_, { params }) {
  const product = await getProductById(params.id);
  if (!product) return notFound("Product not found");
  return json({ product: parseProduct(product) });
}

export async function PATCH(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return unauthorized("Admin authentication required.");
  }

  const existingProduct = await getProductById(params.id);
  if (!existingProduct) {
    return notFound("Product not found.");
  }

  const contentType = request.headers.get("content-type") || "";
  let payload = {};
  const imageFiles = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    for (const [key, value] of formData.entries()) {
      if (key === "images") {
        if (value && typeof value === "object" && typeof value.arrayBuffer === "function" && value.size > 0) {
          imageFiles.push(value);
        }
      } else {
        payload[key] = value;
      }
    }
  } else {
    payload = await request.json().catch(() => ({}));
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = String(payload.name).trim();
  if (payload.slug !== undefined) updates.slug = normalizeSlug(payload.slug) || existingProduct.slug;
  if (payload.sku !== undefined || payload.styleCode !== undefined) {
    const newSku = String(payload.sku || payload.styleCode).trim();
    updates.sku = newSku;
    updates.styleCode = newSku;
  }
  if (payload.collection !== undefined) updates.collection = String(payload.collection).trim();
  if (payload.category !== undefined) updates.category = String(payload.category).trim();
  if (payload.subCategory !== undefined) updates.subCategory = String(payload.subCategory).trim();
  if (payload.setIncludes !== undefined) updates.setIncludes = String(payload.setIncludes).trim();
  if (payload.fabric !== undefined) updates.fabric = String(payload.fabric).trim();
  if (payload.washCare !== undefined || payload.clothCare !== undefined) {
    updates.washCare = String(payload.washCare || payload.clothCare).trim();
  }
  if (payload.color !== undefined) updates.color = String(payload.color).trim();
  if (payload.fit !== undefined) updates.fit = String(payload.fit).trim();
  if (payload.price !== undefined) updates.price = toNumber(payload.price);
  if (payload.mrp !== undefined) updates.mrp = toNumber(payload.mrp);
  if (payload.stock !== undefined) updates.stock = String(payload.stock).trim();
  if (payload.description !== undefined || payload.highlights !== undefined) {
    updates.description = String(payload.description || payload.highlights).trim();
  }
  if (payload.shippingDetails !== undefined) updates.shippingDetails = String(payload.shippingDetails).trim();
  if (payload.disclaimer !== undefined) updates.disclaimer = String(payload.disclaimer).trim();
  if (payload.termsAndConditions !== undefined) updates.termsAndConditions = String(payload.termsAndConditions).trim();
  if (payload.active !== undefined) updates.active = toBool(payload.active);
  if (payload.featured !== undefined) updates.featured = toBool(payload.featured);
  if (payload.sizes !== undefined) updates.sizes = parseSizes(payload.sizes);

  // Handle images if uploaded or provided
  if (imageFiles.length > 0 || payload.imageUrls !== undefined) {
    let images = [];
    if (payload.imageUrls !== undefined) {
      images = String(payload.imageUrls)
        .split(/[\n,]/)
        .map((url) => url.trim())
        .filter(Boolean);
    } else {
      images = Array.isArray(existingProduct.images) ? [...existingProduct.images] : [];
    }

    for (const file of imageFiles) {
      try {
        const url = await uploadProductMedia(file);
        if (url) images.push(url);
      } catch (err) {
        console.error("Failed to upload image file:", err);
      }
    }
    updates.images = images;
  }

  const updated = await updateProduct(params.id, updates);
  return json({ product: parseProduct(updated) });
}

export async function DELETE(_, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return unauthorized("Admin authentication required.");
  }

  const deleted = await deleteProduct(params.id);
  if (!deleted) {
    return notFound("Product not found.");
  }

  return json({ success: true, message: "Product deleted successfully." });
}
