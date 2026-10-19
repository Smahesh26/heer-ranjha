import { getProducts, createProduct } from "@/lib/products";
import { json, badRequest, unauthorized } from "@/lib/http";
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
  return value === true || value === "true" || value === "yes" || value === "1";
}

function toNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === "") return defaultValue;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function parseSizes(value) {
  if (!value) return ["XS", "S", "M", "L", "XL", "XXL"];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((size) => size.trim().toUpperCase())
    .filter(Boolean);
}

export async function GET(request) {
  const url = new URL(request.url);
  const active = url.searchParams.get("active");
  const featured = url.searchParams.get("featured");
  const lowStock = url.searchParams.get("lowStock");
  const collection = url.searchParams.get("collection");
  const category = url.searchParams.get("category");
  const query = url.searchParams.get("query") || url.searchParams.get("q");

  const params = {};
  if (active === "true") params.active = true;
  if (featured === "true") params.featured = true;
  if (collection) params.collection = collection;
  if (category) params.category = category;
  if (query) params.query = query;

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
  const admin = await requireAdmin();
  if (!admin) {
    return unauthorized("Admin authentication required.");
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

  const name = String(payload.name || "").trim();
  if (!name) {
    return badRequest("Product name is required.");
  }

  const slug = normalizeSlug(payload.slug, name);
  const sku = String(payload.sku || payload.styleCode || slug).trim();
  const collection = String(payload.collection || "ASAYA").trim();
  const category = String(payload.category || "Men's Wear").trim();
  const subCategory = String(payload.subCategory || "Kurta").trim();
  const setIncludes = String(payload.setIncludes || "1 Kurta").trim();
  const fabric = String(payload.fabric || "Matka Silk").trim();
  const washCare = String(payload.washCare || payload.clothCare || "Dry Clean Only").trim();
  const color = String(payload.color || "").trim();
  const fit = String(payload.fit || "Regular").trim();
  const price = toNumber(payload.price, 0);
  const mrp = toNumber(payload.mrp || payload.price, price);
  const stock = String(payload.stock ?? "MTO").trim() || "MTO";
  const description = String(payload.description || payload.highlights || "").trim();
  const shippingDetails = String(payload.shippingDetails || "Free shipping across India on all orders. Made-To-Order Timeline: 2-3 Weeks.").trim();
  const disclaimer = String(payload.disclaimer || "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles.").trim();
  const termsAndConditions = String(payload.termsAndConditions || "").trim();
  const active = toBool(payload.active, true);
  const featured = toBool(payload.featured, false);
  const sizes = parseSizes(payload.sizes);

  // Collect existing image URLs if provided as comma-separated or array
  let existingImages = [];
  if (payload.imageUrls) {
    existingImages = String(payload.imageUrls)
      .split(/[\n,]/)
      .map((url) => url.trim())
      .filter(Boolean);
  } else if (Array.isArray(payload.images)) {
    existingImages = payload.images.filter((img) => typeof img === "string");
  }

  // Upload file images
  const uploadedImageUrls = [];
  for (const file of imageFiles) {
    try {
      const url = await uploadProductMedia(file);
      if (url) uploadedImageUrls.push(url);
    } catch (err) {
      console.error("Failed to upload image file:", err);
    }
  }

  const finalImages = [...existingImages, ...uploadedImageUrls];
  if (finalImages.length === 0) {
    finalImages.push("/images/placeholder-product.jpg");
  }

  const newProduct = {
    id: slug,
    name,
    slug,
    sku,
    styleCode: sku,
    color,
    collection,
    category,
    subCategory,
    setIncludes,
    fabric,
    washCare,
    fit,
    description,
    price,
    mrp,
    stock,
    disclaimer,
    shippingDetails,
    termsAndConditions,
    active,
    featured,
    images: finalImages,
    sizes,
    createdAt: new Date().toISOString(),
  };

  const created = await createProduct(newProduct);
  return json({ product: parseProduct(created) }, 201);
}
