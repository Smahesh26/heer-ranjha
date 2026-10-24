import { getAllProducts, createProduct } from "@/lib/product-storage";
import { json, badRequest, unauthorized } from "@/lib/http";
import { getAdminSession } from "@/lib/auth";
import { uploadProductMedia, sanitizeProductImageUrls } from "@/lib/product-media";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const active = url.searchParams.get("active");
  const collection = url.searchParams.get("collection");
  const category = url.searchParams.get("category");

  let products = getAllProducts();

  if (active === "true") {
    products = products.filter((p) => p.active !== false);
  }

  if (collection) {
    const cUpper = collection.trim().toUpperCase();
    products = products.filter((p) => String(p.collection || "").toUpperCase() === cUpper);
  }

  if (category) {
    const catLower = category.trim().toLowerCase();
    products = products.filter((p) => String(p.category || "").toLowerCase().includes(catLower));
  }

  return json({ products, total: products.length });
}

export async function POST(request) {
  const admin = getAdminSession(request);
  if (!admin) {
    return unauthorized("Admin authorization required to create products");
  }

  const contentType = request.headers.get("content-type") || "";

  let payload = {};
  const uploadedImageUrls = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const rawData = {};

    for (const [key, val] of formData.entries()) {
      if (key === "images") {
        if (val instanceof File && val.size > 0) {
          const uploadedUrl = await uploadProductMedia(val);
          if (uploadedUrl) uploadedImageUrls.push(uploadedUrl);
        } else if (typeof val === "string" && val.trim()) {
          uploadedImageUrls.push(val.trim());
        }
      } else {
        rawData[key] = val;
      }
    }

    payload = {
      ...rawData,
      price: rawData.price ? Number(rawData.price) : 0,
      mrp: rawData.mrp ? Number(rawData.mrp) : undefined,
      active: rawData.active !== "false",
      featured: rawData.featured === "true",
      images: uploadedImageUrls,
    };
  } else {
    payload = await request.json().catch(() => ({}));
  }

  const name = String(payload.name || "").trim();
  if (!name) {
    return badRequest("Product name is required");
  }

  try {
    const created = createProduct({
      ...payload,
      images: sanitizeProductImageUrls(payload.images || uploadedImageUrls),
    });

    return json({ product: created }, { status: 201 });
  } catch (err) {
    return badRequest(err.message);
  }
}

