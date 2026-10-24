import { cookies } from "next/headers";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";
import { json, badRequest, unauthorized } from "@/lib/http";
import { parseExcelBuffer } from "@/lib/excel-parser";
import {
  readProductsFromFile,
  writeProductsToFile,
  generateUniqueSlug,
} from "@/lib/product-storage";

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

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return unauthorized("Admin authorization required to upload sheets");
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return badRequest("Invalid form data submission");
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return badRequest("Please select a valid Excel (.xlsx, .xls) or CSV file to upload.");
  }

  const isPreview = formData.get("preview") === "true";
  const defaultCollection = formData.get("defaultCollection")?.toString()?.trim() || "";
  const importMode = formData.get("mode")?.toString()?.trim() || "upsert"; // 'upsert' | 'append' | 'replace-collection'

  let buffer;
  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch (err) {
    return badRequest("Failed to read uploaded file buffer: " + err.message);
  }

  let parseResult;
  try {
    parseResult = parseExcelBuffer(buffer, { defaultCollection, allSheets: true });
  } catch (err) {
    return badRequest("Failed to parse Excel file: " + err.message);
  }

  const { products: parsedProducts, collections: detectedCollections, totalRows } = parseResult;

  if (!parsedProducts || parsedProducts.length === 0) {
    return badRequest("No valid product rows were found in the uploaded sheet. Please check the header names.");
  }

  // If preview mode, return parsed items without modifying store
  if (isPreview) {
    return json({
      preview: true,
      totalRows,
      detectedCollections,
      sampleProducts: parsedProducts.slice(0, 10),
    });
  }

  // Commit mode: persist to store
  const existingProducts = readProductsFromFile();
  let addedCount = 0;
  let updatedCount = 0;

  let finalProductsList = [...existingProducts];

  if (importMode === "replace-collection" && detectedCollections.length > 0) {
    // Remove all existing products belonging to the detected collections
    finalProductsList = finalProductsList.filter(
      (p) => !detectedCollections.includes(String(p.collection || "").trim().toUpperCase())
    );
  }

  for (const item of parsedProducts) {
    const normalizedSku = String(item.sku || "").trim().toLowerCase();
    const normalizedName = String(item.name || "").trim().toLowerCase();

    // Check for existing product by SKU or exact Name
    const existingIdx = finalProductsList.findIndex((p) => {
      const pSku = String(p.sku || p.styleCode || "").trim().toLowerCase();
      const pName = String(p.name || "").trim().toLowerCase();
      return (normalizedSku && pSku === normalizedSku) || (normalizedName && pName === normalizedName);
    });

    if (existingIdx !== -1 && importMode !== "append") {
      // Update existing
      const existing = finalProductsList[existingIdx];
      finalProductsList[existingIdx] = {
        ...existing,
        ...item,
        id: existing.id,
        slug: existing.slug,
        images: item.images && item.images.length > 0 ? item.images : existing.images,
        updatedAt: new Date().toISOString(),
      };
      updatedCount++;
    } else {
      // Add as new
      const slug = generateUniqueSlug(item.name, finalProductsList);
      const newProduct = {
        ...item,
        id: slug,
        slug,
        createdAt: new Date().toISOString(),
      };
      finalProductsList.unshift(newProduct);
      addedCount++;
    }
  }

  writeProductsToFile(finalProductsList);

  // Recalculate unique collections
  const allCollections = Array.from(
    new Set(finalProductsList.map((p) => String(p.collection || "").trim().toUpperCase()).filter(Boolean))
  );

  return json({
    success: true,
    addedCount,
    updatedCount,
    totalProducts: finalProductsList.length,
    detectedCollections,
    allCollections,
    message: `Successfully processed ${parsedProducts.length} products (${addedCount} added, ${updatedCount} updated).`,
  });
}
