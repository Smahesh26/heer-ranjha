import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { json, forbidden, unauthorized } from "@/lib/http";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

function normalizeSize(size) {
  return String(size || "").trim().toUpperCase();
}

export async function POST(request) {
  const session = ensureCustomerSession();
  if (session.error) return session.error;
  const userId = session.userId;

  const payload = await request.json().catch(() => null);
  const items = Array.isArray(payload?.items) ? payload.items : [];

  for (const item of items) {
    if (!item?.productId) continue;

    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || !product.active) continue;

    const size = normalizeSize(item.size);
    const quantity = Math.max(1, Number(item.quantity || 1));

    await prisma.cartItem.upsert({
      where: {
        userId_productId_size: {
          userId,
          productId: item.productId,
          size,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId,
        productId: item.productId,
        size,
        quantity,
      },
    });
  }

  return json({ ok: true });
}
