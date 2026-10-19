import { getAllProducts } from "@/lib/products";
import * as xlsx from "xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = getAllProducts();
  const headers = [
    "S.NO",
    "SKU",
    "Product Name",
    "Product Category",
    "Product Sub Category",
    "Set Includes",
    "Collection",
    "Fabric",
    "Wash Care",
    "Color",
    "Fit",
    "Product Highlights (Description)",
    "Price",
    "MRP",
    "Stock",
    "Sizes",
    "Shipping Details",
    "Disclaimer",
    "Image URLs (comma separated)",
    "Active(Yes/No)",
  ];

  const rows = [headers];

  products.forEach((p, idx) => {
    rows.push([
      idx + 1,
      p.sku || p.styleCode || "",
      p.name || "",
      p.category || "",
      p.subCategory || "",
      p.setIncludes || "",
      p.collection || "",
      p.fabric || "",
      p.washCare || "",
      p.color || "",
      p.fit || "",
      p.description || "",
      p.price || 0,
      p.mrp || p.price || 0,
      p.stock || "MTO",
      Array.isArray(p.sizes) ? p.sizes.join(", ") : (p.sizes || "XS, S, M, L, XL, XXL"),
      p.shippingDetails || "",
      p.disclaimer || "",
      Array.isArray(p.images) ? p.images.join(", ") : (p.images || ""),
      p.active ? "Yes" : "No",
    ]);
  });

  const worksheet = xlsx.utils.aoa_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Products");

  const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="heer-ranjha-products-export-${Date.now()}.xlsx"`,
    },
  });
}
