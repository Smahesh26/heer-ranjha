import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
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

export async function PATCH(request, { params }) {
  const userId = getUserIdFromCookie();
  if (!userId) return unauthorized();

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") return badRequest("Invalid address payload");

  const existing = await prisma.address.findFirst({ where: { id: params.id, userId } });
  if (!existing) return notFound("Address not found");

  const isDefault = payload.isDefault === undefined ? undefined : Boolean(payload.isDefault);
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  const address = await prisma.address.update({
    where: { id: params.id },
    data: {
      ...(payload.label !== undefined ? { label: payload.label || "Shipping" } : {}),
      ...(payload.fullName !== undefined ? { fullName: payload.fullName } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone || null } : {}),
      ...(payload.line1 !== undefined ? { line1: payload.line1 } : {}),
      ...(payload.line2 !== undefined ? { line2: payload.line2 || null } : {}),
      ...(payload.city !== undefined ? { city: payload.city } : {}),
      ...(payload.state !== undefined ? { state: payload.state || null } : {}),
      ...(payload.postalCode !== undefined ? { postalCode: payload.postalCode || null } : {}),
      ...(payload.country !== undefined ? { country: payload.country || "India" } : {}),
      ...(isDefault !== undefined ? { isDefault } : {}),
    },
  });

  return json({ address });
}

export async function DELETE(_, { params }) {
  const userId = getUserIdFromCookie();
  if (!userId) return unauthorized();

  const deleted = await prisma.address.deleteMany({ where: { id: params.id, userId } });
  if (!deleted.count) return notFound("Address not found");

  return json({ ok: true });
}
