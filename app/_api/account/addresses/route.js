import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { badRequest, json, unauthorized } from "@/lib/http";
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

export async function GET() {
  const userId = getUserIdFromCookie();
  if (!userId) return unauthorized();

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  return json({ addresses });
}

export async function POST(request) {
  const userId = getUserIdFromCookie();
  if (!userId) return unauthorized();

  const payload = await request.json().catch(() => null);
  if (!payload?.fullName || !payload?.line1 || !payload?.city) {
    return badRequest("Full name, address line 1 and city are required");
  }

  const isDefault = Boolean(payload.isDefault);
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: {
      userId,
      label: payload.label || "Shipping",
      fullName: payload.fullName,
      phone: payload.phone || null,
      line1: payload.line1,
      line2: payload.line2 || null,
      city: payload.city,
      state: payload.state || null,
      postalCode: payload.postalCode || null,
      country: payload.country || "India",
      isDefault,
    },
  });

  return json({ address }, { status: 201 });
}
