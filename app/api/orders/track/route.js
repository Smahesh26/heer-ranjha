import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const orderIdOrNumber = String(payload?.orderId || "").trim();
  const email = String(payload?.email || "").trim().toLowerCase();

  if (!orderIdOrNumber || !email) {
    return badRequest("Order ID and billing email are required");
  }

  const order = await prisma.order.findFirst({
    where: {
      shippingEmail: email,
      OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
    },
    include: {
      items: true,
      user: { select: { id: true, name: true, email: true } },
      paymentTransactions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) return notFound("No matching order found");
  return json({ order });
}
