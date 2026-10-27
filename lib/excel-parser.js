import * as xlsx from "xlsx";
import { slugify, generateUniqueSlug } from "./product-storage.js";

export function cleanPrice(val) {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return Math.round(val);
  const str = String(val).replace(/,/g, "").replace(/\/-/g, "").replace(/[^\d.]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num);
}

export function extractDriveFileId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Pattern 1: /d/([a-zA-Z0-9_-]+)
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) return dMatch[1];

  // Pattern 2: id=([a-zA-Z0-9_-]+)
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  // Pattern 3: open?id=([a-zA-Z0-9_-]+)
  const openMatch = trimmed.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) return openMatch[1];

  return null;
}

export function convertDriveUrlToDirect(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

export function parseExcelBuffer(buffer, options = {}) {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("Excel file contains no sheets.");
  }

  const allParsedProducts = [];
  const errors = [];
  const foundCollections = new Set();

  // Iterate over all sheets or the first sheet
  const sheetsToProcess = options.allSheets ? workbook.SheetNames : [workbook.SheetNames[0]];

  for (const sheetName of sheetsToProcess) {
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    if (!rawRows || rawRows.length === 0) continue;

    // Detect header row
    let headerIndex = -1;
    for (let i = 0; i < Math.min(15, rawRows.length); i++) {
      const row = rawRows[i];
      if (!Array.isArray(row)) continue;
      const rowStr = row.map((c) => String(c).trim().toUpperCase()).join(" ");

      if (
        rowStr.includes("PRODUCT NAME") ||
        (rowStr.includes("SKU") && rowStr.includes("COLLECTION")) ||
        (rowStr.includes("S.NO") && (rowStr.includes("PRODUCT") || rowStr.includes("SKU")))
      ) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      // Fallback: check if row 0 has any recognizable headers
      headerIndex = 0;
    }

    const headers = rawRows[headerIndex].map((h) => String(h || "").trim());
    const dataRows = rawRows.slice(headerIndex + 1);

    for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
      const row = dataRows[rIdx];
      if (!row || row.length === 0) continue;

      const rowObj = {};
      const imageCols = [];

      for (let cIdx = 0; cIdx < headers.length; cIdx++) {
        const headerName = headers[cIdx];
        const val = row[cIdx];
        if (!headerName) continue;

        const hUpper = headerName.toUpperCase();
        const isImgHeader =
          hUpper.includes("IMAGE") ||
          hUpper.includes("PHOTO") ||
          hUpper.includes("PICTURE") ||
          hUpper.includes("DRIVE") ||
          hUpper.includes("MEDIA") ||
          hUpper.includes("IMG") ||
          (hUpper.includes("LINK") && !hUpper.includes("AFFILIATE"));

        const valStr = val ? String(val).trim() : "";
        const containsUrlOrDrive =
          valStr.startsWith("http://") ||
          valStr.startsWith("https://") ||
          valStr.includes("drive.google.com") ||
          valStr.startsWith("/uploads/") ||
          valStr.startsWith("/images/");

        if (isImgHeader || containsUrlOrDrive) {
          if (valStr) {
            imageCols.push(valStr);
          }
        } else {
          rowObj[headerName] = val;
        }
      }

      // Check if row has a product name
      const nameKey = Object.keys(rowObj).find((k) =>
        k.toUpperCase().includes("PRODUCT NAME") || k.toUpperCase() === "NAME" || k.toUpperCase() === "TITLE"
      );
      const name = nameKey && rowObj[nameKey] ? String(rowObj[nameKey]).trim() : "";

      if (!name) {
        // Skip empty rows
        continue;
      }

      // Find SKU
      const skuKey = Object.keys(rowObj).find((k) =>
        k.toUpperCase().includes("SKU") || k.toUpperCase().includes("STYLE CODE") || k.toUpperCase().includes("ITEM SKU")
      );
      const sku = skuKey && rowObj[skuKey] ? String(rowObj[skuKey]).trim() : slugify(name).toUpperCase();

      // Find Collection
      const colKey = Object.keys(rowObj).find((k) =>
        k.toUpperCase().includes("COLLECTION")
      );
      let collection = colKey && rowObj[colKey] ? String(rowObj[colKey]).trim().toUpperCase() : "";
      if (!collection) {
        collection = options.defaultCollection ? options.defaultCollection.trim().toUpperCase() : "GENERAL";
      }
      foundCollections.add(collection);

      // Category & Sub Category
      const catKey = Object.keys(rowObj).find((k) =>
        k.toUpperCase().includes("PRODUCT CATEGORY") || k.toUpperCase() === "CATEGORY" || k.toUpperCase() === "GENDER"
      );
      const subCatKey = Object.keys(rowObj).find((k) =>
        k.toUpperCase().includes("SUB CATEGORY") || k.toUpperCase() === "SUBCATEGORY"
      );
      const category = catKey && rowObj[catKey] ? String(rowObj[catKey]).trim() : "Men's Wear";
      const subCategory = subCatKey && rowObj[subCatKey] ? String(rowObj[subCatKey]).trim() : "Kurta";

      // Set Includes
      const setIncKey = Object.keys(rowObj).find((k) =>
        k.toUpperCase().includes("SET INCLUDES")
      );
      const setIncludes = setIncKey && rowObj[setIncKey] ? String(rowObj[setIncKey]).trim() : "1 Ensemble";

      // Fabric & Wash Care
      const fabricKey = Object.keys(rowObj).find((k) => k.toUpperCase().includes("FABRIC"));
      const washCareKey = Object.keys(rowObj).find((k) => k.toUpperCase().includes("WASH CARE"));
      const fabric = fabricKey && rowObj[fabricKey] ? String(rowObj[fabricKey]).trim() : "Matka Silk";
      const washCare = washCareKey && rowObj[washCareKey] ? String(rowObj[washCareKey]).trim() : "Dry Clean Only";

      // Highlights / Description
      const descKey = Object.keys(rowObj).find((k) =>
        k.toUpperCase().includes("HIGHLIGHTS") || k.toUpperCase().includes("DESCRIPTION")
      );
      const description = descKey && rowObj[descKey] ? String(rowObj[descKey]).trim() : "";

      // Price & MRP
      const priceKey = Object.keys(rowObj).find((k) =>
        k.toUpperCase().includes("PRICE") && !k.toUpperCase().includes("MRP")
      );
      const mrpKey = Object.keys(rowObj).find((k) => k.toUpperCase().includes("MRP"));
      const price = cleanPrice(priceKey ? rowObj[priceKey] : 0);
      const mrp = cleanPrice(mrpKey ? rowObj[mrpKey] : price);

      // Fit
      const fitKey = Object.keys(rowObj).find((k) => k.toUpperCase().includes("FIT"));
      const fit = fitKey && rowObj[fitKey] ? String(rowObj[fitKey]).trim() : "Regular";

      // Disclaimer & Shipping Details
      const discKey = Object.keys(rowObj).find((k) => k.toUpperCase().includes("DISCLAIMER"));
      const shipKey = Object.keys(rowObj).find((k) =>
        k.toUpperCase().includes("SHIPPING") || k.toUpperCase().includes("ORDER PROCESSING")
      );
      const disclaimer = discKey && rowObj[discKey]
        ? String(rowObj[discKey]).trim()
        : "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.";
      const shippingDetails = shipKey && rowObj[shipKey]
        ? String(rowObj[shipKey]).trim()
        : "Free shipping across India on all orders. Made-To-Order timeline: 2-3 weeks.";

      // Stock
      const stockKey = Object.keys(rowObj).find((k) => k.toUpperCase().includes("STOCK"));
      const stock = stockKey && rowObj[stockKey] ? String(rowObj[stockKey]).trim() : "MTO";

      // Active
      const activeKey = Object.keys(rowObj).find((k) => k.toUpperCase().includes("ACTIVE"));
      let active = true;
      if (activeKey && rowObj[activeKey] !== undefined) {
        const val = String(rowObj[activeKey]).trim().toLowerCase();
        if (val === "no" || val === "false" || val === "0") active = false;
      }

      // Collect images
      const images = [];
      for (const colVal of imageCols) {
        // May contain comma separated URLs
        const parts = colVal.split(/[,;\n]+/).map((u) => u.trim()).filter(Boolean);
        for (const u of parts) {
          const converted = convertDriveUrlToDirect(u);
          if (converted && !images.includes(converted)) {
            images.push(converted);
          }
        }
      }

      const slug = slugify(name);
      allParsedProducts.push({
        id: slug,
        name,
        slug,
        sku,
        styleCode: sku,
        collection,
        category,
        subCategory,
        setIncludes,
        fabric,
        washCare,
        description,
        price: price || 15000,
        mrp: mrp || price || 15000,
        fit,
        disclaimer,
        shippingDetails,
        stock,
        active,
        images,
        sizes: ["S", "M", "L", "XL"],
      });
    }
  }

  return {
    products: allParsedProducts,
    collections: Array.from(foundCollections),
    totalRows: allParsedProducts.length,
    errors,
  };
}

export function generateExcelTemplate() {
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
    "Product Highlights (Description)",
    "Price",
    "MRP",
    "Fit",
    "Disclaimer",
    "Shipping Details",
    "Stock",
    "Image URLs (comma separated)",
    "Active(Yes/No)",
  ];

  const sampleRows = [
    [
      1,
      "HKM-401-GOLD",
      "Royal Gold Hand Embroidered Kurta",
      "Men's Wear",
      "Kurta",
      "1 Kurta",
      "VIRASAT",
      "Matka Silk",
      "Dry Clean Only",
      "Handcrafted in luminous gold textured matka silk with kantha-inspired thread embroidery across the placket and collar. Ideal for celebrations and weddings.",
      "24500",
      "24500",
      "Regular",
      "Slight variations in colour, texture, embroidery and finish may occur due to handcrafted nature.",
      "Free shipping across India on all orders. Made-To-Order timeline: 2-3 weeks.",
      "MTO",
      "https://drive.google.com/file/d/1exampleFileId1/view?usp=sharing, https://drive.google.com/file/d/1exampleFileId2/view?usp=sharing",
      "Yes",
    ],
    [
      2,
      "HWS-502-ROSE",
      "Rose Pink Embellished Lehenga Set",
      "Women's Wear",
      "Lehenga",
      "3 Pc Lehenga Set (Lehenga, Blouse & Dupatta)",
      "VIRASAT",
      "Dupion Silk",
      "Dry Clean Only",
      "Featuring a flared dupion silk skirt with hand-embroidered floral motifs, paired with a matching blouse and tissue dupatta.",
      "68000",
      "68000",
      "Regular",
      "Slight variations in colour and embroidery may occur.",
      "Free shipping across India on all orders. Made-To-Order timeline: 3-4 weeks.",
      "MTO",
      "https://drive.google.com/file/d/1exampleFileId3/view?usp=sharing",
      "Yes",
    ],
  ];

  const wsData = [headers, ...sampleRows];
  const worksheet = xlsx.utils.aoa_to_sheet(wsData);

  // Set column widths for readability
  worksheet["!cols"] = [
    { wch: 6 },  // S.NO
    { wch: 16 }, // SKU
    { wch: 35 }, // Product Name
    { wch: 18 }, // Category
    { wch: 20 }, // Sub Category
    { wch: 25 }, // Set Includes
    { wch: 18 }, // Collection
    { wch: 16 }, // Fabric
    { wch: 16 }, // Wash Care
    { wch: 50 }, // Description
    { wch: 12 }, // Price
    { wch: 12 }, // MRP
    { wch: 12 }, // Fit
    { wch: 40 }, // Disclaimer
    { wch: 40 }, // Shipping Details
    { wch: 10 }, // Stock
    { wch: 60 }, // Image URLs
    { wch: 14 }, // Active
  ];

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Products");

  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
