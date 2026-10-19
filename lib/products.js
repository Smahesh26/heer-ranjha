import fs from "fs";
import path from "path";
import initialProductsData from "./data/products.json";

const PRIMARY_DATA_PATH = path.join(process.cwd(), "lib", "data", "products.json");
const SHOP_DATA_PATH = path.join(process.cwd(), "components", "shop", "products.json");

let memoryCache = null;

export function getAllProducts() {
  if (memoryCache && Array.isArray(memoryCache)) {
    return memoryCache;
  }
  try {
    if (fs.existsSync(PRIMARY_DATA_PATH)) {
      const raw = fs.readFileSync(PRIMARY_DATA_PATH, "utf-8");
      memoryCache = JSON.parse(raw);
      return memoryCache;
    }
  } catch (err) {
    console.error("Failed to read products from disk:", err);
  }
  memoryCache = [...initialProductsData];
  return memoryCache;
}

export function saveProducts(products) {
  if (!Array.isArray(products)) {
    throw new Error("Products must be an array");
  }
  memoryCache = products;
  const jsonContent = JSON.stringify(products, null, 2);

  try {
    fs.writeFileSync(PRIMARY_DATA_PATH, jsonContent, "utf-8");
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

  return true;
}

export async function getProducts(params = {}) {
  let result = [...getAllProducts()];

  // Filtering
  if (params.category) {
    result = result.filter(
      (p) => (p.category || "").toLowerCase() === params.category.toLowerCase()
    );
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
  const products = getAllProducts();
  const searchId = String(id || "").toLowerCase();
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
  const products = getAllProducts();
  const searchSlug = String(slug || "").toLowerCase();
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

  if (index === -1) {
    return false;
  }

  products.splice(index, 1);
  saveProducts(products);
  return true;
}
