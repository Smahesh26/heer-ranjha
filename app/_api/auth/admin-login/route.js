import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { json, badRequest, unauthorized } from "@/lib/http";
import { loginSchema } from "@/lib/validators";
import { signAuthToken, getAuthCookieName } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid login data", parsed.error.flatten());
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "ADMIN") {
    return unauthorized("Admin access required");
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    return unauthorized("Invalid email or password");
  }

  const token = signAuthToken({ sub: user.id, role: user.role, email: user.email });
  const response = json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
  });
  response.cookies.set(getAuthCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}