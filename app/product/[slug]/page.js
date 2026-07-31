import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductContent from "@/components/product/ProductContent";
import { notFound } from "next/navigation";
import { PRODUCTS } from "@/components/shop/shopData";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({
    slug: p.slug || p.id,
  }));
}

export async function generateMetadata({ params }) {
  const slug = String(params.slug || "").toLowerCase().replace(/^\/+/, "");
  const product = PRODUCTS.find((p) => (p.slug || p.id).toLowerCase() === slug);

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
  const slug = String(params.slug || "").toLowerCase().replace(/^\/+/, "");
  const productRecord = PRODUCTS.find((p) => (p.slug || p.id).toLowerCase() === slug);

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
