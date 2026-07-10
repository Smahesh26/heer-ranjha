import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { json, unauthorized, notFound } from "@/lib/http";
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

export async function DELETE(_, { params }) {
  const userId = getUserIdFromCookie();
  if (!userId) return unauthorized();

  const deleted = await prisma.wishlistItem.deleteMany({ where: { id: params.id, userId } });
  if (deleted.count === 0) {
    return notFound("Wishlist item not found");
  }

  return json({ ok: true });
}
