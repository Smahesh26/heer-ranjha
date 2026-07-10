import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { json, badRequest, unauthorized } from "@/lib/http";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function getUserIdFromCookie() {
  const token = cookies().get(getAuthCookieName())?.value;
  if (!token) return null;

  try {
    const decoded = verifyAuthToken(token);
    return decoded?.sub || null;
  } catch {
    return null;
  }
}

function parseWishlistItem(record) {
  const images = safeJsonParse(record.product.images, []);
  return {
    id: record.id,
    productId: record.productId,
    slug: record.product.slug,
    name: record.product.name,
    detail: record.product.description,
    collection: record.product.collection,
    price: Number(record.product.price || 0),
    image: images[0] || null,
    inStock: record.product.stock > 0,
  };
}

export async function GET() {
  const userId = getUserIdFromCookie();
  if (!userId) return unauthorized();

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          collection: true,
          price: true,
          stock: true,
          images: true,
        },
      },
    },
  });

  return json({ items: items.map(parseWishlistItem) });
}

export async function POST(request) {
  const userId = getUserIdFromCookie();
  if (!userId) return unauthorized();

  const payload = await request.json().catch(() => null);
  if (!payload?.productId) return badRequest("Product is required");

  const product = await prisma.product.findUnique({ where: { id: payload.productId } });
  if (!product || !product.active) return badRequest("Product not available");

  const item = await prisma.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId,
        productId: payload.productId,
      },
    },
    update: {},
    create: {
      userId,
      productId: payload.productId,
    },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          collection: true,
          price: true,
          stock: true,
          images: true,
        },
      },
    },
  });

  return json({ item: parseWishlistItem(item) }, { status: 201 });
}
