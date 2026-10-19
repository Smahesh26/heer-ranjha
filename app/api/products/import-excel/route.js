import { getAllProducts, saveProducts } from "@/lib/products";
import { json, badRequest, unauthorized } from "@/lib/http";
import { cookies } from "next/headers";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";
import * as xlsx from "xlsx";

export const dynamic = "force-dynamic";

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

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanPrice(value) {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function cleanString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str.length ? str : fallback;
}

function normalizeHeader(h) {
  if (!h) return "";
  return String(h).toLowerCase().trim().replace(/[\s\-_]+/g, " ");
}

function parseBoolean(val, defaultVal = true) {
  if (val === null || val === undefined || val === "") return defaultVal;
  const str = String(val).toLowerCase().trim();
  if (["no", "false", "0", "draft", "inactive", "n"].includes(str)) return false;
  if (["yes", "true", "1", "active", "y"].includes(str)) return true;
  return defaultVal;
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return unauthorized("Admin authentication required.");
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return badRequest("Expected multipart/form-data with excel file.");
  }

  const formData = await request.formData();
  const file = formData.get("file") || formData.get("excel");

  if (!file || typeof file !== "object" || typeof file.arrayBuffer !== "function") {
    return badRequest("No valid Excel file provided.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let workbook;
  try {
    workbook = xlsx.read(buffer, { type: "buffer", cellStyles: false, cellDates: false });
  } catch (err) {
    return badRequest(`Failed to parse Excel file: ${err.message}`);
  }

  if (!workbook.SheetNames || !workbook.SheetNames.length) {
    return badRequest("Excel file contains no sheets.");
  }

  const existingProducts = [...getAllProducts()];
  const productMapBySku = new Map();
  const productMapBySlug = new Map();

  existingProducts.forEach((p, idx) => {
    if (p.sku) productMapBySku.set(String(p.sku).trim().toLowerCase(), idx);
    if (p.slug) productMapBySlug.set(String(p.slug).trim().toLowerCase(), idx);
  });

  let totalParsed = 0;
  let addedCount = 0;
  let updatedCount = 0;
  const sheetSummaries = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (!rawRows || rawRows.length < 2) continue;

    // Find header row by searching for keywords
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(10, rawRows.length); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;
      const joined = row.map(c => normalizeHeader(c)).join(" ");
      if (
        (joined.includes("sku") || joined.includes("style code")) &&
        (joined.includes("product name") || joined.includes("collection") || joined.includes("fabric") || joined.includes("price"))
      ) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) {
      // Fallback: check if row 0 or 1 has 'name' or 'sku'
      if (rawRows[0]?.some(c => normalizeHeader(c).includes("name") || normalizeHeader(c).includes("sku"))) {
        headerRowIdx = 0;
      } else if (rawRows[1]?.some(c => normalizeHeader(c).includes("name") || normalizeHeader(c).includes("sku"))) {
        headerRowIdx = 1;
      } else {
        continue; // Skip sheets that don't look like product tables
      }
    }

    const headerRow = rawRows[headerRowIdx];
    const colIndex = {
      sku: -1,
      name: -1,
      category: -1,
      subCategory: -1,
      setIncludes: -1,
      collection: -1,
      fabric: -1,
      washCare: -1,
      description: -1,
      price: -1,
      mrp: -1,
      fit: -1,
      disclaimer: -1,
      shippingDetails: -1,
      stock: -1,
      color: -1,
      active: -1,
      sizes: -1,
      imageCols: [],
    };

    headerRow.forEach((col, idx) => {
      const h = normalizeHeader(col);
      if (!h) return;
      if (h.includes("sku") || h.includes("style code") || h.includes("product code") || h.includes("item sku")) colIndex.sku = idx;
      else if (h.includes("product name") || h === "name" || h === "title") colIndex.name = idx;
      else if (h.includes("sub category") || h.includes("subcategory")) colIndex.subCategory = idx;
      else if (h.includes("category")) colIndex.category = idx;
      else if (h.includes("set include") || h.includes("set includes") || h.includes("components")) colIndex.setIncludes = idx;
      else if (h.includes("collection")) colIndex.collection = idx;
      else if (h.includes("fabric") || h.includes("material")) colIndex.fabric = idx;
      else if (h.includes("wash care") || h.includes("cloth care") || h.includes("care")) colIndex.washCare = idx;
      else if (h.includes("description") || h.includes("highlights") || h.includes("product highlight")) colIndex.description = idx;
      else if (h.includes("mrp")) colIndex.mrp = idx;
      else if (h.includes("price")) colIndex.price = idx;
      else if (h.includes("fit")) colIndex.fit = idx;
      else if (h.includes("disclaimer")) colIndex.disclaimer = idx;
      else if (h.includes("shipping") || h.includes("order processing")) colIndex.shippingDetails = idx;
      else if (h.includes("stock") || h.includes("inventory")) colIndex.stock = idx;
      else if (h.includes("color") || h.includes("colour")) colIndex.color = idx;
      else if (h.includes("active") || h.includes("status")) colIndex.active = idx;
      else if (h.includes("size") && !h.includes("fit")) colIndex.sizes = idx;
      else if (h.includes("image") || h.includes("url") || h.includes("photo")) colIndex.imageCols.push(idx);
    });

    // If imageCols is empty, any column header starting with "image" was caught above, or check if there were repeated columns
    headerRow.forEach((col, idx) => {
      const h = normalizeHeader(col);
      if (h.includes("image") && !colIndex.imageCols.includes(idx)) {
        colIndex.imageCols.push(idx);
      }
    });

    let sheetAdded = 0;
    let sheetUpdated = 0;

    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || !row.length) continue;

      const rawName = colIndex.name !== -1 ? row[colIndex.name] : "";
      const rawSku = colIndex.sku !== -1 ? row[colIndex.sku] : "";

      if (!rawName && !rawSku) continue;

      const name = cleanString(rawName, cleanString(rawSku, "Unnamed Product"));
      const sku = cleanString(rawSku, cleanString(rawName, "SKU-PROD"));
      const slug = slugify(name || sku);

      const category = cleanString(colIndex.category !== -1 ? row[colIndex.category] : "Men's Wear");
      const subCategory = cleanString(colIndex.subCategory !== -1 ? row[colIndex.subCategory] : "Kurta");
      const setIncludes = cleanString(colIndex.setIncludes !== -1 ? row[colIndex.setIncludes] : "1 Kurta");
      const collection = cleanString(colIndex.collection !== -1 ? row[colIndex.collection] : sheetName.replace(/corrected|sheet/gi, "").trim() || "ASAYA");
      const fabric = cleanString(colIndex.fabric !== -1 ? row[colIndex.fabric] : "Matka Silk");
      const washCare = cleanString(colIndex.washCare !== -1 ? row[colIndex.washCare] : "Dry Clean Only");
      const color = cleanString(colIndex.color !== -1 ? row[colIndex.color] : "");
      const fit = cleanString(colIndex.fit !== -1 ? row[colIndex.fit] : "Regular");
      const description = cleanString(colIndex.description !== -1 ? row[colIndex.description] : "");
      const price = cleanPrice(colIndex.price !== -1 ? row[colIndex.price] : 0);
      const mrp = cleanPrice(colIndex.mrp !== -1 ? row[colIndex.mrp] : price);
      const stock = cleanString(colIndex.stock !== -1 ? row[colIndex.stock] : "MTO", "MTO");
      const disclaimer = cleanString(colIndex.disclaimer !== -1 ? row[colIndex.disclaimer] : "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles.");
      const shippingDetails = cleanString(colIndex.shippingDetails !== -1 ? row[colIndex.shippingDetails] : "Free shipping across India on all orders. Made-To-Order Timeline: 2-3 Weeks.");
      const active = colIndex.active !== -1 ? parseBoolean(row[colIndex.active], true) : true;

      // Extract image URLs
      const images = [];
      for (const colIdx of colIndex.imageCols) {
        const val = row[colIdx];
        if (val) {
          const split = String(val).split(/[\n,]/).map(s => s.trim()).filter(Boolean);
          images.push(...split);
        }
      }

      // Sizes
      let sizes = ["XS", "S", "M", "L", "XL", "XXL"];
      if (colIndex.sizes !== -1 && row[colIndex.sizes]) {
        const sz = String(row[colIndex.sizes]).split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
        if (sz.length) sizes = sz;
      }

      const skuKey = sku.toLowerCase();
      const slugKey = slug.toLowerCase();
      const matchIndex = productMapBySku.has(skuKey)
        ? productMapBySku.get(skuKey)
        : productMapBySlug.get(slugKey);

      if (matchIndex !== undefined && matchIndex >= 0 && matchIndex < existingProducts.length) {
        // Update existing product
        const prev = existingProducts[matchIndex];
        const updatedImages = images.length > 0 ? images : prev.images || ["/images/placeholder-product.jpg"];

        existingProducts[matchIndex] = {
          ...prev,
          name,
          sku,
          styleCode: sku,
          slug: prev.slug || slug,
          collection: collection || prev.collection,
          category: category || prev.category,
          subCategory: subCategory || prev.subCategory,
          setIncludes: setIncludes || prev.setIncludes,
          fabric: fabric || prev.fabric,
          washCare: washCare || prev.washCare,
          color: color || prev.color,
          fit: fit || prev.fit,
          description: description || prev.description,
          price: price > 0 ? price : prev.price,
          mrp: mrp > 0 ? mrp : (prev.mrp || prev.price),
          stock: stock || prev.stock,
          disclaimer: disclaimer || prev.disclaimer,
          shippingDetails: shippingDetails || prev.shippingDetails,
          active,
          sizes: sizes.length ? sizes : prev.sizes,
          images: updatedImages,
          updatedAt: new Date().toISOString(),
        };
        sheetUpdated++;
        updatedCount++;
      } else {
        // Add new product
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
          active,
          featured: false,
          images: images.length > 0 ? images : ["/images/placeholder-product.jpg"],
          sizes,
          createdAt: new Date().toISOString(),
        };

        const newIdx = existingProducts.push(newProduct) - 1;
        productMapBySku.set(skuKey, newIdx);
        productMapBySlug.set(slugKey, newIdx);
        sheetAdded++;
        addedCount++;
      }
      totalParsed++;
    }

    sheetSummaries.push({ sheet: sheetName, added: sheetAdded, updated: sheetUpdated });
  }

  // Save changes to disk
  saveProducts(existingProducts);

  return json({
    success: true,
    totalParsed,
    addedCount,
    updatedCount,
    totalProducts: existingProducts.length,
    sheets: sheetSummaries,
    message: `Successfully processed ${totalParsed} rows: ${addedCount} added, ${updatedCount} updated. Total catalogue count is now ${existingProducts.length}.`,
  });
}

function buildSheetRows(productsList) {
  const headers = [
    "S.NO",
    "SKU",
    "Style Code",
    "Product Name",
    "Product Category",
    "Product Sub Category",
    "Set Includes",
    "Collection",
    "Fabric",
    "Wash Care",
    "Color",
    "Fit",
    "Product Description",
    "Product Highlights (Description)",
    "Price",
    "MRP",
    "Stock",
    "Sizes",
    "Shipping Details",
    "Shipping And Order Processing",
    "Disclaimer",
    "Image URLs (comma separated)",
    "Active(Yes/No)",
  ];

  const rows = [headers];

  productsList.forEach((p, idx) => {
    const desc = p.description || p.highlights || p.productHighlights || "";
    const shipping = p.shippingDetails || p.shippingAndOrderProcessing || "Free shipping across India on all orders. Made-To-Order Timeline: 2-3 Weeks.";
    rows.push([
      idx + 1,
      p.sku || p.styleCode || "",
      p.styleCode || p.sku || "",
      p.name || "",
      p.category || "",
      p.subCategory || "",
      p.setIncludes || "",
      p.collection || "",
      p.fabric || "",
      p.washCare || "",
      p.color || "",
      p.fit || "Regular",
      desc,
      desc,
      Number(p.price || 0),
      Number(p.mrp || p.price || 0),
      p.stock || "MTO",
      Array.isArray(p.sizes) ? p.sizes.join(", ") : (p.sizes || "XS, S, M, L, XL, XXL"),
      shipping,
      shipping,
      p.disclaimer || "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles.",
      Array.isArray(p.images) ? p.images.join(", ") : (p.images || ""),
      p.active ? "Yes" : "No",
    ]);
  });

  const worksheet = xlsx.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 18 },
    { wch: 36 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 55 },
    { wch: 55 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 22 },
    { wch: 45 },
    { wch: 45 },
    { wch: 45 },
    { wch: 50 },
    { wch: 14 },
  ];

  return worksheet;
}

// GET endpoint to download current products as an Excel sheet
export async function GET() {
  const products = getAllProducts();
  const workbook = xlsx.utils.book_new();

  // 1. Master sheet with all products
  const masterSheet = buildSheetRows(products);
  xlsx.utils.book_append_sheet(workbook, masterSheet, "All Products");

  // 2. Collection-specific sheets
  const collections = ["ASAYA", "NAYI LEHER", "ROOMANI", "GANGA JAMUNI"];
  collections.forEach((colName) => {
    const subset = products.filter(
      (p) => (p.collection || "").trim().toUpperCase() === colName
    );
    if (subset.length > 0) {
      const colSheet = buildSheetRows(subset);
      xlsx.utils.book_append_sheet(workbook, colSheet, colName);
    }
  });

  const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="heer-ranjha-products-export-${Date.now()}.xlsx"`,
    },
  });
}
