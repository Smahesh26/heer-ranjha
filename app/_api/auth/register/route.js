import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { json, badRequest } from "@/lib/http";
import { registerSchema } from "@/lib/validators";
import { signAuthToken, getAuthCookieName } from "@/lib/auth";

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid registration data", parsed.error.flatten());
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return badRequest("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "CUSTOMER" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const token = signAuthToken({ sub: user.id, role: user.role, email: user.email });
  const response = json({ user });
  response.cookies.set(getAuthCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
