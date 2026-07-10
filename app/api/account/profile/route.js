import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, createdAt: true },
  });

  return json({ user });
}

export async function PATCH(request) {
  const userId = getUserIdFromCookie();
  if (!userId) return unauthorized();

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") return badRequest("Invalid profile payload");

  const updates = {
    ...(payload.name ? { name: String(payload.name).trim() } : {}),
    ...(payload.email ? { email: String(payload.email).trim().toLowerCase() } : {}),
    ...(payload.phone !== undefined ? { phone: payload.phone ? String(payload.phone).trim() : null } : {}),
  };

  if (payload.currentPassword || payload.newPassword) {
    if (!payload.currentPassword || !payload.newPassword) {
      return badRequest("Both current and new password are required");
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return unauthorized();

    const ok = await bcrypt.compare(String(payload.currentPassword), existing.passwordHash);
    if (!ok) return badRequest("Current password is incorrect");

    updates.passwordHash = await bcrypt.hash(String(payload.newPassword), 10);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updates,
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, createdAt: true },
  });

  return json({ user });
}
