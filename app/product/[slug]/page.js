import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductContent from "@/components/product/ProductContent";
import { notFound } from "next/navigation";
import { getAllProducts, getProductById, slugify } from "@/lib/product-storage";
import { prisma } from "@/lib/prisma";
import { PRODUCTS } from "@/components/shop/shopData";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  const all = getAllProducts();
  const list = all.length > 0 ? all : PRODUCTS;
  return list.map((p) => ({
    slug: p.slug || p.id,
  }));
}

export async function findProductBySlug(rawSlug) {
  if (!rawSlug) return null;
  const decoded = decodeURIComponent(String(rawSlug)).trim().toLowerCase().replace(/^\/+/, "");
  const slugified = slugify(decoded);

  // 1. Check live file storage (includes products from Excel uploads & admin creates)
  try {
    const directMatch = getProductById(decoded) || getProductById(slugified);
    if (directMatch) return directMatch;

    const all = getAllProducts();
    const found = all.find((p) => {
      const pSlug = String(p.slug || p.id || "").toLowerCase().trim();
      const pSku = String(p.sku || p.styleCode || "").toLowerCase().trim();
      const pNameSlug = slugify(p.name);
      return (
        pSlug === decoded ||
        pSlug === slugified ||
        pSku === decoded ||
        pSku === slugified ||
        pNameSlug === decoded ||
        pNameSlug === slugified
      );
    });
    if (found) return found;
  } catch (err) {
    console.warn("Live product lookup error:", err.message);
  }

  // 2. Check Prisma database if available
  try {
    if (prisma && prisma.product) {
      const dbProduct = await prisma.product.findFirst({
        where: {
          OR: [
            { slug: { equals: decoded, mode: "insensitive" } },
            { slug: { equals: slugified, mode: "insensitive" } },
            { sku: { equals: decoded, mode: "insensitive" } },
            { id: { equals: decoded, mode: "insensitive" } },
          ],
        },
      });
      if (dbProduct) {
        return {
          ...dbProduct,
          images: typeof dbProduct.images === "string" ? JSON.parse(dbProduct.images) : dbProduct.images || [],
          sizes: typeof dbProduct.sizeOptions === "string" ? JSON.parse(dbProduct.sizeOptions) : ["S", "M", "L", "XL"],
        };
      }
    }
  } catch (err) {
    console.warn("Prisma lookup failed in product page:", err.message);
  }

  // 3. Fallback to bundled PRODUCTS
  return (
    PRODUCTS.find((p) => {
      const pSlug = String(p.slug || p.id || "").toLowerCase().trim();
      const pSku = String(p.sku || p.styleCode || "").toLowerCase().trim();
      const pNameSlug = slugify(p.name);
      return (
        pSlug === decoded ||
        pSlug === slugified ||
        pSku === decoded ||
        pSku === slugified ||
        pNameSlug === decoded ||
        pNameSlug === slugified
      );
    }) || null
  );
}

export async function generateMetadata({ params }) {
  const product = await findProductBySlug(params.slug);

  if (!product) {
    return {
      title: "Product | Heer Ranjha",
      description: "Hand-embroidered pieces from Heer Ranjha.",
    };
  }

  return {
    title: `${product.name} | Heer Ranjha`,
    description: `${product.name} - ${product.description || ""}. Part of the ${product.collection || "Heer Ranjha"} collection by Heer Ranjha.`,
  };
}

export default async function ProductPage({ params }) {
  const productRecord = await findProductBySlug(params.slug);

  if (!productRecord) {
    notFound();
  }

  const allProducts = getAllProducts();
  const catalog = allProducts.length ? allProducts : PRODUCTS;
  const relatedRecords = catalog
    .filter(
      (p) =>
        String(p.collection || "").trim().toUpperCase() ===
          String(productRecord.collection || "").trim().toUpperCase() &&
        p.id !== productRecord.id &&
        p.slug !== productRecord.slug
    )
    .slice(0, 4);

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

