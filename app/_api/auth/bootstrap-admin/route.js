import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { json, badRequest } from "@/lib/http";
import { registerSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse({ ...payload, role: "ADMIN" });

  if (!parsed.success) {
    return badRequest("Invalid admin registration data", parsed.error.flatten());
  }

  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) {
    return json({ error: "Admin already exists" }, { status: 409 });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingEmail) {
    return json({ error: "Email is already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const admin = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "ADMIN",
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return json({ admin }, { status: 201 });
}