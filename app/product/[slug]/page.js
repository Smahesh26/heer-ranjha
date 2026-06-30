import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductContent from "@/components/product/ProductContent";
import { PRODUCTS } from "@/components/shop/shopData";

export async function generateMetadata({ params }) {
  const slug = params.slug.toUpperCase().replace(/-/g, "-");
  const product = PRODUCTS.find(
    (p) => p.id.toLowerCase() === params.slug.toLowerCase()
  ) || PRODUCTS[0];
  return {
    title: `${product.name} | Heer Ranjha`,
    description: `${product.name} - ${product.detail}. Part of the ${product.collection} collection by Heer Ranjha.`,
  };
}

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.id.toLowerCase() }));
}

export default function ProductPage({ params }) {
  const product =
    PRODUCTS.find((p) => p.id.toLowerCase() === params.slug.toLowerCase()) ||
    PRODUCTS[0];
  const related = PRODUCTS.filter(
    (p) => p.collection === product.collection && p.id !== product.id
  ).slice(0, 4);

  return (
    <>
      <Navbar />
      <main>
        <ProductContent product={product} related={related} />
      </main>
      <Footer />
    </>
  );
}
