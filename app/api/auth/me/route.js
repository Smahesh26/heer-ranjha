import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = cookies().get(getAuthCookieName())?.value;

  if (!token) {
    return unauthorized();
  }

  try {
    const decoded = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true },
    });

    if (!user) {
      return unauthorized();
    }

    return json({ user });
  } catch {
    return unauthorized();
  }
}
