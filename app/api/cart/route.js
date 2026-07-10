import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { json, badRequest, forbidden, unauthorized } from "@/lib/http";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function normalizeSize(size) {
  return String(size || "").trim().toUpperCase();
}

function parseCartItem(record) {
  const images = safeJsonParse(record.product.images, []);
  const sizeCharges = safeJsonParse(record.product.sizeCharges, {});
  const size = normalizeSize(record.size);
  const extraCharge = Number(sizeCharges[size] || 0);
  const unitPrice = Number(record.product.price || 0) + (Number.isFinite(extraCharge) ? extraCharge : 0);

  return {
    id: record.id,
    productId: record.productId,
    slug: record.product.slug,
    name: record.product.name,
    detail: record.product.description,
    collection: record.product.collection,
    size,
    quantity: record.quantity,
    unitPrice,
    lineTotal: unitPrice * record.quantity,
    image: images[0] || null,
    inStock: record.product.stock > 0,
  };
}

function getUserIdFromCookie() {
  const token = cookies().get(getAuthCookieName())?.value;
  if (!token) return { userId: null, role: null };

  try {
    const decoded = verifyAuthToken(token);
    return { userId: decoded?.sub || null, role: decoded?.role || null };
  } catch {
    return { userId: null, role: null };
  }
}

function ensureCustomerSession() {
  const { userId, role } = getUserIdFromCookie();
  if (!userId) return { error: unauthorized() };
  if (role === "ADMIN") return { error: forbidden("Cart is available for customer accounts only") };
  return { userId };
}

export async function GET() {
  const session = ensureCustomerSession();
  if (session.error) return session.error;
  const userId = session.userId;

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
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
          sizeCharges: true,
        },
      },
    },
  });

  const items = cartItems.map(parseCartItem);
  return json({ items });
}

export async function POST(request) {
  const session = ensureCustomerSession();
  if (session.error) return session.error;
  const userId = session.userId;

  const payload = await request.json().catch(() => null);
  if (!payload?.productId) {
    return badRequest("Product is required");
  }

  const product = await prisma.product.findUnique({ where: { id: payload.productId } });
  if (!product || !product.active) {
    return badRequest("Product not available");
  }

  const size = normalizeSize(payload.size);
  const quantity = Math.max(1, Number(payload.quantity || 1));

  const item = await prisma.cartItem.upsert({
    where: {
      userId_productId_size: {
        userId,
        productId: payload.productId,
        size,
      },
    },
    update: {
      quantity: { increment: quantity },
    },
    create: {
      userId,
      productId: payload.productId,
      size,
      quantity,
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
          sizeCharges: true,
        },
      },
    },
  });

  return json({ item: parseCartItem(item) }, { status: 201 });
}

export async function DELETE() {
  const session = ensureCustomerSession();
  if (session.error) return session.error;
  const userId = session.userId;

  await prisma.cartItem.deleteMany({ where: { userId } });
  return json({ ok: true });
}
