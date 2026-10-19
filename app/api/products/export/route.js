import { getAllProducts } from "@/lib/products";
import * as xlsx from "xlsx";

export const dynamic = "force-dynamic";

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
    { wch: 6 },  // S.NO
    { wch: 18 }, // SKU
    { wch: 18 }, // Style Code
    { wch: 36 }, // Product Name
    { wch: 16 }, // Category
    { wch: 18 }, // Sub Category
    { wch: 16 }, // Set Includes
    { wch: 16 }, // Collection
    { wch: 16 }, // Fabric
    { wch: 16 }, // Wash Care
    { wch: 14 }, // Color
    { wch: 12 }, // Fit
    { wch: 55 }, // Product Description
    { wch: 55 }, // Product Highlights (Description)
    { wch: 12 }, // Price
    { wch: 12 }, // MRP
    { wch: 10 }, // Stock
    { wch: 22 }, // Sizes
    { wch: 45 }, // Shipping Details
    { wch: 45 }, // Shipping And Order Processing
    { wch: 45 }, // Disclaimer
    { wch: 50 }, // Image URLs
    { wch: 14 }, // Active
  ];

  return worksheet;
}

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

