import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { json, unauthorized } from "@/lib/http";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

export async function POST(request) {
  const userId = getUserIdFromCookie();
  if (!userId) return unauthorized();

  const payload = await request.json().catch(() => null);
  const items = Array.isArray(payload?.items) ? payload.items : [];

  for (const item of items) {
    if (!item?.productId) continue;

    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || !product.active) continue;

    await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId: item.productId,
        },
      },
      update: {},
      create: {
        userId,
        productId: item.productId,
      },
    });
  }

  return json({ ok: true });
}
