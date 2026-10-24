import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductContent from "@/components/product/ProductContent";
import { notFound } from "next/navigation";
import { PRODUCTS } from "@/components/shop/shopData";

export const dynamicParams = true;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({
    slug: p.slug || p.id,
  }));
}

function findProductBySlug(slug) {
  const s = String(slug || "").toLowerCase().replace(/^\/+/, "");
  return PRODUCTS.find((p) => {
    const pSlug = (p.slug || p.id || "").toLowerCase();
    const pSku = (p.sku || p.styleCode || "").toLowerCase();
    if (pSlug === s || pSku === s) return true;
    if (s === "multi-coloured-hand-embroidered-bandhgala" && pSlug === "mutlti-coloured-hand-embroidered-bandhgala") return true;
    if (s === "mutlti-coloured-hand-embroidered-bandhgala" && pSlug === "multi-coloured-hand-embroidered-bandhgala") return true;
    if (s === "indigo-blue-hand-embroidered-kurta-hkm-305" && pSku === "hkm-305-blue") return true;
    return false;
  });
}

export async function generateMetadata({ params }) {
  const product = findProductBySlug(params.slug);

  if (!product) {
    return {
      title: "Product | Heer Ranjha",
      description: "Hand-embroidered pieces from Heer Ranjha.",
    };
  }

  return {
    title: `${product.name} | Heer Ranjha`,
    description: `${product.name} - ${product.description}. Part of the ${product.collection} collection by Heer Ranjha.`,
  };
}

export default function ProductPage({ params }) {
  const productRecord = findProductBySlug(params.slug);

  if (!productRecord) {
    notFound();
  }

  const relatedRecords = PRODUCTS.filter(
    (p) => p.collection === productRecord.collection && p.id !== productRecord.id
  ).slice(0, 4);

  return (
    <>
      <Navbar />
      <main>
        <ProductContent product={productRecord} related={relatedRecords} />
      </main>
      <Footer />
    </>
  );
}
