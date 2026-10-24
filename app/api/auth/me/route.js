import { prisma } from "@/lib/prisma";
import { extractAuthToken, verifyAuthToken } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const token = extractAuthToken(request);

  if (!token) {
    return unauthorized();
  }

  try {
    const decoded = verifyAuthToken(token);
    if (!decoded) {
      return unauthorized();
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true },
      });

      if (user) {
        return json({ user });
      }
    } catch (dbErr) {
      console.warn("DB offline during auth verification:", dbErr.message);
    }

    // If role is ADMIN in decoded token, allow fallback admin session
    if (decoded.role === "ADMIN" || decoded.email === "admin@heerranjha.com") {
      return json({
        user: {
          id: decoded.sub || "admin-master",
          name: "Heer Ranjha Admin",
          email: decoded.email || "admin@heerranjha.com",
          role: "ADMIN",
          avatarUrl: null,
          createdAt: new Date().toISOString(),
        },
      });
    }

    return unauthorized();
  } catch {
    return unauthorized();
  }
}
