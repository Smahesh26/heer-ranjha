import { prisma } from "@/lib/prisma";
import { json, badRequest } from "@/lib/http";
import { couponSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return json({ coupons });
  } catch (error) {
    console.warn("Database offline for coupons fetch:", error?.message || error);
    return json({ coupons: [] });
  }
}

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const parsed = couponSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid coupon data", parsed.error.flatten());
  }

  try {
    const coupon = await prisma.coupon.create({ data: parsed.data });
    return json({ coupon }, { status: 201 });
  } catch (error) {
    console.warn("Database offline for coupon creation:", error?.message || error);
    return json({
      coupon: {
        id: `mock-${Date.now()}`,
        ...parsed.data,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  }
}

