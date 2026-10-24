import { json } from "@/lib/http";
import { getAllCollections, readProductsFromFile } from "@/lib/product-storage";

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
