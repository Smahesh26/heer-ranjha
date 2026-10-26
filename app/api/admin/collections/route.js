import { json, unauthorized, badRequest } from "@/lib/http";
import { getAllCollections, readProductsFromFile, deleteCollection } from "@/lib/product-storage";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const collections = getAllCollections();
  const products = readProductsFromFile();

  const enhanced = collections.map((col) => {
    const sample = products.find(
      (p) => String(p.collection || "").toUpperCase() === col.name
    );
    return {
      name: col.name,
      count: col.count,
      sampleImage: sample?.images?.[0] || null,
      sampleName: sample?.name || null,
    };
  });

  return json({ collections: enhanced });
}

export async function DELETE(request) {
  const admin = getAdminSession(request);
  if (!admin) {
    return unauthorized("Admin authorization required to delete collections");
  }

  const url = new URL(request.url);
  let name = url.searchParams.get("name");

  if (!name) {
    const body = await request.json().catch(() => ({}));
    name = body?.name;
  }

  if (!name) {
    return badRequest("Collection name is required");
  }

  const result = deleteCollection(name);
  return json({
    success: true,
    message: `Collection "${name}" and ${result.deletedCount} piece(s) deleted.`,
    deletedCount: result.deletedCount,
  });
}

