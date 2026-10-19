import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { json, badRequest, forbidden, unauthorized, notFound } from "@/lib/http";
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

export async function PATCH(request, { params }) {
  const session = ensureCustomerSession();
  if (session.error) return session.error;
  const userId = session.userId;

  const payload = await request.json().catch(() => null);
  const quantity = Number(payload?.quantity);
  if (!Number.isFinite(quantity) || quantity < 1) {
    return badRequest("Quantity must be at least 1");
  }

  const updated = await prisma.cartItem.updateMany({
    where: { id: params.id, userId },
    data: { quantity: Math.trunc(quantity) },
  });

  if (updated.count === 0) {
    return notFound("Cart item not found");
  }

  return json({ ok: true });
}

export async function DELETE(_, { params }) {
  const session = ensureCustomerSession();
  if (session.error) return session.error;
  const userId = session.userId;

  const deleted = await prisma.cartItem.deleteMany({ where: { id: params.id, userId } });
  if (deleted.count === 0) {
    return notFound("Cart item not found");
  }

  return json({ ok: true });
}
