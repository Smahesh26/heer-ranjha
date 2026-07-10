import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductContent from "@/components/product/ProductContent";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function parseProduct(product) {
  return {
    ...product,
    images: safeJsonParse(product.images, []),
    sizes: safeJsonParse(product.sizeOptions, []),
    sizeCharges: safeJsonParse(product.sizeCharges, {}),
  };
}

async function findProductBySlug(inputSlug) {
  const slug = String(inputSlug || "").toLowerCase().replace(/^\/+/, "");
  return prisma.product.findFirst({
    where: {
      OR: [{ slug }, { slug: `/${slug}` }],
    },
  });
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
    description: `${product.name} - ${product.description}. Part of the ${product.collection} collection by Heer Ranjha.`,
  };
}

export default async function ProductPage({ params }) {
  const productRecord = await findProductBySlug(params.slug);

  if (!productRecord || !productRecord.active) {
    notFound();
  }

  const relatedRecords = await prisma.product.findMany({
    where: {
      active: true,
      collection: productRecord.collection,
      NOT: { id: productRecord.id },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const product = parseProduct(productRecord);
  const related = relatedRecords.map(parseProduct);

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
