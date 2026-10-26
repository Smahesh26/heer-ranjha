import fs from "fs";
import path from "path";
import { prisma } from "./prisma.js";

const PRODUCTS_SHOP_PATH = path.join(process.cwd(), "components", "shop", "products.json");
const PRODUCTS_DATA_PATH = path.join(process.cwd(), "lib", "data", "products.json");

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateUniqueSlug(name, existingProducts = [], currentId = null) {
  const baseSlug = slugify(name) || "product";
  let slug = baseSlug;
  let counter = 1;

  while (existingProducts.some((p) => (p.slug === slug || p.id === slug) && p.id !== currentId)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export function readProductsFromFile() {
  try {
    if (fs.existsSync(PRODUCTS_SHOP_PATH)) {
      const data = fs.readFileSync(PRODUCTS_SHOP_PATH, "utf8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Error reading components/shop/products.json:", err.message);
  }

  try {
    if (fs.existsSync(PRODUCTS_DATA_PATH)) {
      const data = fs.readFileSync(PRODUCTS_DATA_PATH, "utf8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Error reading lib/data/products.json:", err.message);
  }

  return [];
}

export function writeProductsToFile(products) {
  if (!Array.isArray(products)) {
    throw new Error("writeProductsToFile requires an array of products");
  }

  const jsonString = JSON.stringify(products, null, 2);

  // Write to components/shop/products.json
  try {
    fs.mkdirSync(path.dirname(PRODUCTS_SHOP_PATH), { recursive: true });
    fs.writeFileSync(PRODUCTS_SHOP_PATH, jsonString, "utf8");
  } catch (err) {
    console.error("Failed to write to components/shop/products.json:", err.message);
  }

  // Write to lib/data/products.json
  try {
    fs.mkdirSync(path.dirname(PRODUCTS_DATA_PATH), { recursive: true });
    fs.writeFileSync(PRODUCTS_DATA_PATH, jsonString, "utf8");
  } catch (err) {
    console.error("Failed to write to lib/data/products.json:", err.message);
  }

  // Best-effort asynchronous DB sync (does not block or fail if DB is offline)
  syncProductsToPrisma(products).catch(() => {});

  return true;
}

async function syncProductsToPrisma(products) {
  try {
    // Only attempt if prisma can connect
    for (const p of products.slice(0, 50)) { // sync in batches/recent
      await prisma.product.upsert({
        where: { slug: p.slug },
        update: {
          name: p.name,
          description: p.description || "",
          category: p.category || "General",
          subCategory: p.subCategory || "General",
          collection: p.collection || "General",
          fabric: p.fabric || "Mixed",
          price: Number(p.price) || 0,
          mrp: Number(p.mrp) || Number(p.price) || 0,
          images: JSON.stringify(p.images || []),
          sizeOptions: JSON.stringify(p.sizes || ["S", "M", "L", "XL"]),
          active: p.active !== false,
          featured: Boolean(p.featured),
        },
        create: {
          slug: p.slug,
          name: p.name,
          description: p.description || "",
          category: p.category || "General",
          subCategory: p.subCategory || "General",
          collection: p.collection || "General",
          fabric: p.fabric || "Mixed",
          price: Number(p.price) || 0,
          mrp: Number(p.mrp) || Number(p.price) || 0,
          images: JSON.stringify(p.images || []),
          sizeOptions: JSON.stringify(p.sizes || ["S", "M", "L", "XL"]),
          active: p.active !== false,
          featured: Boolean(p.featured),
        },
      });
    }
  } catch (err) {
    // Ignore DB sync error in static/offline environments
  }
}

export function getAllProducts() {
  return readProductsFromFile();
}

export function getProductById(id) {
  const products = readProductsFromFile();
  const normalizedId = String(id || "").toLowerCase().trim();
  return (
    products.find(
      (p) =>
        String(p.id).toLowerCase() === normalizedId ||
        String(p.slug).toLowerCase() === normalizedId ||
        String(p.sku).toLowerCase() === normalizedId
    ) || null
  );
}

export function createProduct(productData) {
  const products = readProductsFromFile();
  const name = String(productData.name || "").trim();
  if (!name) throw new Error("Product name is required");

  const slug = generateUniqueSlug(productData.slug || name, products);
  const id = slug;

  const newProduct = {
    id,
    name,
    slug,
    sku: String(productData.sku || productData.styleCode || slug.toUpperCase()).trim(),
    styleCode: String(productData.styleCode || productData.sku || slug.toUpperCase()).trim(),
    collection: String(productData.collection || "General").trim().toUpperCase(),
    category: String(productData.category || "Men's Wear").trim(),
    subCategory: String(productData.subCategory || "Kurta").trim(),
    setIncludes: String(productData.setIncludes || "1 Ensemble").trim(),
    fabric: String(productData.fabric || "Matka Silk").trim(),
    washCare: String(productData.washCare || "Dry Clean Only").trim(),
    description: String(productData.description || "").trim(),
    price: Number(productData.price) || 0,
    mrp: Number(productData.mrp) || Number(productData.price) || 0,
    fit: String(productData.fit || "Regular").trim(),
    disclaimer:
      String(productData.disclaimer || "").trim() ||
      "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
    shippingDetails:
      String(productData.shippingDetails || "").trim() ||
      "Free shipping across India on all orders. Made-To-Order Timeline: 2-3 Weeks.",
    stock: productData.stock != null ? productData.stock : "MTO",
    active: productData.active !== false,
    featured: Boolean(productData.featured),
    images: Array.isArray(productData.images) ? productData.images : [],
    sizes: Array.isArray(productData.sizes) ? productData.sizes : ["S", "M", "L", "XL"],
    sizeCharges: productData.sizeCharges || {},
    createdAt: new Date().toISOString(),
  };

  products.unshift(newProduct);
  writeProductsToFile(products);
  return newProduct;
}

export function updateProduct(id, updates) {
  const products = readProductsFromFile();
  const normalizedId = String(id).toLowerCase().trim();
  const index = products.findIndex(
    (p) =>
      String(p.id).toLowerCase() === normalizedId ||
      String(p.slug).toLowerCase() === normalizedId
  );

  if (index === -1) {
    throw new Error(`Product with ID '${id}' not found`);
  }

  const existing = products[index];
  const updatedName = updates.name !== undefined ? String(updates.name).trim() : existing.name;
  let updatedSlug = existing.slug;

  if (updates.slug && updates.slug !== existing.slug) {
    updatedSlug = generateUniqueSlug(updates.slug, products, existing.id);
  }

  const updatedProduct = {
    ...existing,
    ...updates,
    id: existing.id,
    name: updatedName,
    slug: updatedSlug,
    collection: updates.collection !== undefined ? String(updates.collection).trim().toUpperCase() : existing.collection,
    price: updates.price !== undefined ? Number(updates.price) || 0 : existing.price,
    mrp: updates.mrp !== undefined ? Number(updates.mrp) || Number(updates.price) || 0 : existing.mrp,
    active: updates.active !== undefined ? Boolean(updates.active) : existing.active,
    featured: updates.featured !== undefined ? Boolean(updates.featured) : existing.featured,
    images: Array.isArray(updates.images) ? updates.images : existing.images,
    updatedAt: new Date().toISOString(),
  };

  products[index] = updatedProduct;
  writeProductsToFile(products);
  return updatedProduct;
}

export function deleteProduct(id) {
  const products = readProductsFromFile();
  const normalizedId = String(id).toLowerCase().trim();
  const filtered = products.filter(
    (p) =>
      String(p.id).toLowerCase() !== normalizedId &&
      String(p.slug).toLowerCase() !== normalizedId
  );

  if (filtered.length === products.length) {
    throw new Error(`Product with ID '${id}' not found`);
  }

  writeProductsToFile(filtered);
  return true;
}

export function deleteCollection(collectionName) {
  const target = String(collectionName || "").trim().toUpperCase();
  if (!target) return { deletedCount: 0 };

  const products = readProductsFromFile();
  const filtered = products.filter(
    (p) => String(p.collection || "").trim().toUpperCase() !== target
  );

  const deletedCount = products.length - filtered.length;
  if (deletedCount > 0) {
    writeProductsToFile(filtered);
  }

  return { deletedCount };
}

export function getAllCollections() {
  const products = readProductsFromFile();
  const counts = {};

  for (const p of products) {
    const col = String(p.collection || "").trim().toUpperCase();
    if (col) {
      counts[col] = (counts[col] || 0) + 1;
    }
  }

  return Object.entries(counts).map(([name, count]) => ({
    name,
    count,
  }));
}

