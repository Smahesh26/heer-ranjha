import fs from "fs";
import * as xlsx from "xlsx";

const products = JSON.parse(fs.readFileSync("lib/data/products.json", "utf8"));

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

const workbook = xlsx.utils.book_new();
const masterSheet = buildSheetRows(products);
xlsx.utils.book_append_sheet(workbook, masterSheet, "All Products");

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

xlsx.writeFile(workbook, "new/Heer-Ranjha-Master-Catalogue.xlsx");
xlsx.writeFile(workbook, "public/Heer-Ranjha-Master-Catalogue.xlsx");
console.log(`Successfully generated master catalogue with ${products.length} products and sheets: ${workbook.SheetNames.join(", ")}`);
