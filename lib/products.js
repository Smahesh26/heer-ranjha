import fs from "fs";
import path from "path";
import initialProductsData from "./data/products.json";
import { prisma } from "@/lib/prisma";

const PRIMARY_DATA_PATH = path.join(process.cwd(), "lib", "data", "products.json");
const SHOP_DATA_PATH = path.join(process.cwd(), "components", "shop", "products.json");

let memoryCache = null;
let lastMtime = 0;

export function mapDbProduct(p) {
  if (!p) return null;

  let images = [];
  try {
    if (typeof p.images === "string") {
      const trimmed = p.images.trim();
      images = trimmed.startsWith("[")
        ? JSON.parse(trimmed)
        : trimmed.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(p.images)) {
      images = p.images;
    }
  } catch {
    images = ["/images/placeholder-product.jpg"];
  }
  if (!images || !images.length) {
    images = ["/images/placeholder-product.jpg"];
  }

  let sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  try {
    if (p.sizeOptions) {
      const trimmed = p.sizeOptions.trim();
      if (trimmed.startsWith("[")) {
        sizes = JSON.parse(trimmed);
      } else {
        sizes = trimmed.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      }
    }
  } catch {}

  return {
    id: p.slug || p.id,
    dbId: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku || p.styleCode || p.slug,
    styleCode: p.styleCode || p.sku || p.slug,
    description: p.description || "",
    category: p.category || "Men's Wear",
    subCategory: p.subCategory || "Kurta",
    collection: p.collection || "ASAYA",
    fabric: p.fabric || "Matka Silk",
    color: p.color || "",
    fit: p.fit || "Regular",
    setIncludes: p.setIncludes || "",
    washCare: p.washCare || p.clothCare || "Dry Clean Only",
    disclaimer: p.disclaimer || "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles.",
    shippingDetails: p.shippingDetails || "Free shipping across India on all orders. Made-To-Order Timeline: 2-3 Weeks.",
    price: Number(p.price || 0),
    mrp: Number(p.mrp || p.price || 0),
    stock: p.stockStatus || (p.stock > 0 ? String(p.stock) : "MTO"),
    active: p.active !== false,
    featured: Boolean(p.featured),
    images,
    sizes: sizes.length ? sizes : ["XS", "S", "M", "L", "XL", "XXL"],
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function getAllProducts() {
  try {
    if (fs.existsSync(PRIMARY_DATA_PATH)) {
      const stat = fs.statSync(PRIMARY_DATA_PATH);
      if (memoryCache && Array.isArray(memoryCache) && stat.mtimeMs === lastMtime) {
        return memoryCache;
      }
      const raw = fs.readFileSync(PRIMARY_DATA_PATH, "utf-8");
      memoryCache = JSON.parse(raw);
      lastMtime = stat.mtimeMs;
      return memoryCache;
    }
  } catch (err) {
    console.error("Failed to read products from disk:", err);
  }
  if (!memoryCache) {
    memoryCache = [...initialProductsData];
  }
  return memoryCache;
}

export async function syncProductToDb(p) {
  if (!prisma || !prisma.product) return;
  const slug = String(p.slug || p.id || "").toLowerCase().trim();
  if (!slug) return;

  const imagesStr = JSON.stringify(Array.isArray(p.images) ? p.images : [p.images || "/images/placeholder-product.jpg"]);
  const sizesStr = JSON.stringify(Array.isArray(p.sizes) ? p.sizes : ["XS", "S", "M", "L", "XL", "XXL"]);
  const price = Number(p.price || 0);
  const mrp = Number(p.mrp || p.price || 0);

  const data = {
    slug,
    name: p.name || slug,
    sku: String(p.sku || p.styleCode || slug).trim(),
    styleCode: String(p.styleCode || p.sku || slug).trim(),
    category: p.category || "Men's Wear",
    subCategory: p.subCategory || "Kurta",
    collection: p.collection || "ASAYA",
    fabric: p.fabric || "Matka Silk",
    color: p.color || "",
    fit: p.fit || "Regular",
    setIncludes: p.setIncludes || "",
    washCare: p.washCare || p.clothCare || "Dry Clean Only",
    disclaimer: p.disclaimer || "",
    shippingDetails: p.shippingDetails || "",
    description: p.description || "",
    price,
    mrp,
    stock: typeof p.stock === "number" ? p.stock : 10,
    stockStatus: String(p.stock || "MTO"),
    images: imagesStr,
    sizeOptions: sizesStr,
    active: p.active !== false,
    featured: Boolean(p.featured),
  };

  try {
    await prisma.product.upsert({
      where: { slug },
      update: data,
      create: data,
    });
  } catch (err) {
    console.warn(`[syncProductToDb] Failed to upsert ${slug}:`, err.message);
  }
}

export function saveProducts(products) {
  if (!Array.isArray(products)) {
    throw new Error("Products must be an array");
  }
  memoryCache = products;
  const jsonContent = JSON.stringify(products, null, 2);

  try {
    fs.writeFileSync(PRIMARY_DATA_PATH, jsonContent, "utf-8");
    if (fs.existsSync(PRIMARY_DATA_PATH)) {
      lastMtime = fs.statSync(PRIMARY_DATA_PATH).mtimeMs;
    }
  } catch (err) {
    console.error("Failed to write to primary products.json:", err);
  }

  try {
    if (fs.existsSync(path.dirname(SHOP_DATA_PATH))) {
      fs.writeFileSync(SHOP_DATA_PATH, jsonContent, "utf-8");
    }
  } catch (err) {
    console.error("Failed to write to shop products.json:", err);
  }

  // Asynchronously sync all products to the database in background
  if (prisma && prisma.product) {
    Promise.resolve().then(async () => {
      for (const prod of products) {
        await syncProductToDb(prod);
      }
    }).catch((e) => console.warn("Background DB sync error:", e));
  }

  return true;
}

export async function getProducts(params = {}) {
  let list = null;

  // 1. Try querying from Prisma Database first
  try {
    if (prisma && prisma.product) {
      const dbRecords = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      });
      if (Array.isArray(dbRecords) && dbRecords.length > 0) {
        list = dbRecords.map(mapDbProduct);
      }
    }
  } catch (err) {
    console.warn("Prisma products lookup failed, falling back to JSON:", err.message);
  }

  // 2. Fallback to disk JSON if DB is empty or disconnected
  if (!list || !list.length) {
    list = [...getAllProducts()];
  }

  let result = [...list];

  // Filtering
  if (params.category) {
    const cat = params.category.toLowerCase();
    result = result.filter((p) => {
      const pCat = (p.category || "").toLowerCase();
      if (cat === "men") return pCat.includes("men") && !pCat.includes("women");
      if (cat === "women") return pCat.includes("women");
      return pCat === cat;
    });
  }
  if (params.collection) {
    result = result.filter(
      (p) => (p.collection || "").toLowerCase() === params.collection.toLowerCase()
    );
  }
  if (params.featured !== undefined) {
    result = result.filter((p) => Boolean(p.featured) === Boolean(params.featured));
  }
  if (params.active !== undefined) {
    result = result.filter((p) => Boolean(p.active) === Boolean(params.active));
  }

  if (params.query) {
    const q = params.query.toLowerCase();
    result = result.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.collection || "").toLowerCase().includes(q)
    );
  }

  // Sorting
  if (params.orderBy) {
    for (const key in params.orderBy) {
      const order = params.orderBy[key]; // 'asc' or 'desc'
      result.sort((a, b) => {
        if (a[key] < b[key]) return order === "asc" ? -1 : 1;
        if (a[key] > b[key]) return order === "asc" ? 1 : -1;
        return 0;
      });
    }
  } else {
    // Default sort
    result.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  // Pagination
  const page = params.page || 1;
  const limit = params.limit;
  let total = result.length;

  if (limit) {
    const start = (page - 1) * limit;
    result = result.slice(start, start + limit);
  }

  return {
    products: result,
    total,
    page,
    totalPages: limit ? Math.ceil(total / limit) : 1,
  };
}

export async function getProductById(id) {
  const searchId = String(id || "").toLowerCase().trim();
  if (prisma && prisma.product) {
    try {
      const record = await prisma.product.findFirst({
        where: {
          OR: [
            { id: searchId },
            { slug: searchId },
            { sku: searchId },
          ],
        },
      });
      if (record) return mapDbProduct(record);
    } catch {}
  }

  const products = getAllProducts();
  return (
    products.find(
      (p) =>
        String(p.id || "").toLowerCase() === searchId ||
        String(p.slug || "").toLowerCase() === searchId ||
        String(p.sku || "").toLowerCase() === searchId
    ) || null
  );
}

export async function getProductBySlug(slug) {
  const searchSlug = String(slug || "").toLowerCase().trim();
  if (prisma && prisma.product) {
    try {
      const record = await prisma.product.findFirst({
        where: {
          OR: [
            { slug: searchSlug },
            { id: searchSlug },
            { sku: searchSlug },
          ],
        },
      });
      if (record) return mapDbProduct(record);
    } catch {}
  }

  const products = getAllProducts();
  return (
    products.find(
      (p) =>
        String(p.slug || "").toLowerCase() === searchSlug ||
        String(p.id || "").toLowerCase() === searchSlug ||
        String(p.sku || "").toLowerCase() === searchSlug
    ) || null
  );
}

export async function createProduct(productData) {
  const products = getAllProducts();
  products.unshift(productData);
  saveProducts(products);

  if (prisma && prisma.product) {
    await syncProductToDb(productData);
  }
  return productData;
}

export async function updateProduct(id, updates) {
  const products = getAllProducts();
  const searchId = String(id || "").toLowerCase();
  const index = products.findIndex(
    (p) =>
      String(p.id || "").toLowerCase() === searchId ||
      String(p.slug || "").toLowerCase() === searchId ||
      String(p.sku || "").toLowerCase() === searchId
  );

  if (index === -1) {
    return null;
  }

  const updated = {
    ...products[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  products[index] = updated;
  saveProducts(products);

  if (prisma && prisma.product) {
    await syncProductToDb(updated);
  }
  return updated;
}

export async function deleteProduct(id) {
  const products = getAllProducts();
  const searchId = String(id || "").toLowerCase();
  const index = products.findIndex(
    (p) =>
      String(p.id || "").toLowerCase() === searchId ||
      String(p.slug || "").toLowerCase() === searchId ||
      String(p.sku || "").toLowerCase() === searchId
  );

  if (index !== -1) {
    const [deleted] = products.splice(index, 1);
    saveProducts(products);
    if (prisma && prisma.product && (deleted.slug || deleted.id)) {
      try {
        await prisma.product.deleteMany({
          where: {
            OR: [
              { slug: deleted.slug },
              { id: deleted.id },
            ],
          },
        });
      } catch {}
    }
    return true;
  }

  return false;
}
