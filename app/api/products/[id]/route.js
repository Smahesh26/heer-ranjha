import { getProductById, updateProduct, deleteProduct } from "@/lib/product-storage";
import { json, notFound, badRequest, unauthorized } from "@/lib/http";
import { cookies } from "next/headers";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";
import { uploadProductMedia, sanitizeProductImageUrls } from "@/lib/product-media";

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

export async function GET(_, { params }) {
  const product = getProductById(params.id);
  if (!product) return notFound("Product not found");
  return json({ product });
}

export async function PATCH(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return unauthorized("Admin authorization required to update products");
  }

  const existing = getProductById(params.id);
  if (!existing) {
    return notFound("Product not found");
  }

  const contentType = request.headers.get("content-type") || "";
  let updates = {};
  const newUploadedUrls = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const rawData = {};

    for (const [key, val] of formData.entries()) {
      if (key === "images") {
        if (val instanceof File && val.size > 0) {
          const url = await uploadProductMedia(val);
          if (url) newUploadedUrls.push(url);
        } else if (typeof val === "string" && val.trim()) {
          newUploadedUrls.push(val.trim());
        }
      } else {
        rawData[key] = val;
      }
    }

    updates = { ...rawData };
    if (rawData.price !== undefined) updates.price = Number(rawData.price);
    if (rawData.mrp !== undefined) updates.mrp = Number(rawData.mrp);
    if (rawData.active !== undefined) updates.active = rawData.active !== "false";
    if (rawData.featured !== undefined) updates.featured = rawData.featured === "true";

    if (newUploadedUrls.length > 0) {
      updates.images = sanitizeProductImageUrls([
        ...(existing.images || []),
        ...newUploadedUrls,
      ]);
    }
  } else {
    updates = await request.json().catch(() => ({}));
  }

  try {
    const updated = updateProduct(existing.id, updates);
    return json({ product: updated });
  } catch (err) {
    return badRequest(err.message);
  }
}

export async function DELETE(_, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return unauthorized("Admin authorization required to delete products");
  }

  const existing = getProductById(params.id);
  if (!existing) {
    return notFound("Product not found");
  }

  try {
    deleteProduct(existing.id);
    return json({ success: true, message: `Product ${existing.name} deleted.` });
  } catch (err) {
    return badRequest(err.message);
  }
}
