import { prisma } from "@/lib/prisma";
import { json, badRequest } from "@/lib/http";
import { couponSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return json({ coupons });
}

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const parsed = couponSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid coupon data", parsed.error.flatten());
  }

  const coupon = await prisma.coupon.create({ data: parsed.data });
  return json({ coupon }, { status: 201 });
}
